const fs = require("fs").promises;
const path = require("path");
const { poo, file } = require("fontawesome");
const { pool } = require("./db");
const bcrypt = require("bcrypt");
// import { promises as fs } from 'fs';
// import * as path from 'path';

const importAll = async (req, res) => {
  const { data, files, folder_name } = req.body;

  if (!files || !folder_name || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  try {
    const timestamp = new Date();

    // Insert into tb_files table
    const result1 = await pool.query(
      `INSERT INTO tb_files (folder_name, files, timestamp)
         VALUES ($1, $2, $3) RETURNING id`,
      [folder_name, files, timestamp]
    );

    const file_id = result1.rows[0]?.id;

    if (!file_id) {
      return res.status(500).json({ message: "File insert failed" });
    }

    // Loop over the data and insert into tb_adcp_master
    for (let index = 0; index < data.length; index++) {
      const item = data[index];

      // Optional: Validate each item before insert
      if (
        !item.station_id ||
        !item.DateTime ||
        item.speed == null ||
        item.direction == null ||
        item.depth == null ||
        item.pressure == null ||
        item.battery == null
      ) {
        console.warn(`Skipping invalid row at index ${index}:`, item);
        continue;
      }

      await pool.query(
        `INSERT INTO tb_adcp_master (
          station_id, date, speed, direction, dept, pressure, battery, file_id, file_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.station_id,
          item.DateTime,
          item.speed,
          item.direction,
          item.depth,
          item.pressure,
          item.battery,
          file_id,
          item.file_name,
        ]
      );
    }

    res.status(200).json({
      message: "File and data imported successfully",
      file_id,
      rowsInserted: data.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getFiles = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM tb_folders`);
    res.status(200).json({
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error}` });
  }
};

const updateValues = async (req, res) => {
  const { file_name, lat, lon, high_water_level, unit } = req.body;

  if (
    !file_name ||
    !Array.isArray(file_name) ||
    file_name.length === 0 ||
    unit.length === 0
  ) {
    return res.status(400).json({ error: "file_name (array) is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ Step 1: Update lat/lon for each file_id
    if (lat !== undefined || lon !== undefined) {
      for (const file of file_name) {
        const fields = [];
        const values = [];
        let idx = 1;

        if (lat !== undefined) {
          fields.push(`lat = $${idx++}`);
          values.push(lat);
        }

        if (lon !== undefined) {
          fields.push(`lon = $${idx++}`);
          values.push(lon);
        }

        const updateQuery = `
          UPDATE tb_${file.file_id}
          SET ${fields.join(", ")}
        `;
        const updateQuery2 = `
          UPDATE tb_${file.file_id}_processed
          SET ${fields.join(", ")}
        `;

        await client.query(updateQuery, values);
        await client.query(updateQuery2, values);
      }
      if (unit !== undefined || unit.length > 0) {
        await client.query(
          `UPDATE tb_file
           SET coord_unit = $1, coord_unit_to = $2
           WHERE id = $3`,
          [unit, unit, file_name[0].file_id]
        );
      }
    }

    // ✅ Step 2: Update high_water_level if timestamp provided (only in one table)
    if (high_water_level) {
      const targetTable = `tb_${file_name[0].file_id}`;

      // Reset all rows
      await client.query(`UPDATE ${targetTable} SET high_water_level = 0`);
      await client.query(
        `UPDATE ${targetTable}_processed SET high_water_level = 0`
      );

      // Set high_water_level = 1 for matching timestamp
      await client.query(
        `UPDATE ${targetTable}
         SET high_water_level = 1
         WHERE date = $1`,
        [high_water_level]
      );
      await client.query(
        `UPDATE ${targetTable}_processed
         SET high_water_level = 1
         WHERE date = $1`,
        [high_water_level]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Update successful" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating ADCP:", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  } finally {
    client.release();
  }
};

const createFolderAndFile = async (req, res) => {
  const { folder_name, file_name, data, unitsFrom, unitsTo } = req.body;
  if (!folder_name || !Array.isArray(file_name) || typeof data !== "object") {
    return res.status(400).json({ message: "Invalid input format" });
  }

  try {
    // 1. Insert folder
    const folderInsertQuery = `INSERT INTO tb_folders (folder_name) VALUES($1) RETURNING id`;
    const folderResult = await pool.query(folderInsertQuery, [folder_name]);

    const folderId = folderResult.rows[0]?.id;
    if (!folderId) {
      return res
        .status(500)
        .json({ status: "failed", message: "Folder creation failed" });
    }

    const insertedFiles = [];

    // 2. Loop through each file and handle insertions
    for (const fname of file_name) {
      const fileData = data[fname];
      if (!Array.isArray(fileData)) {
        continue; // Skip invalid data for this file
      }

      // Insert file
      const fileInsertQuery = `INSERT INTO tb_file (file_name, folder_id, water_level_unit, current_speed_unit, current_direction_unit, battery_unit, depth_unit, coord_unit, water_level_unit_to, current_speed_unit_to, current_direction_unit_to, battery_unit_to, depth_unit_to, coord_unit_to) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`;
      const fileResult = await pool.query(fileInsertQuery, [
        fname,
        folderId,
        unitsTo.waterLevel,
        unitsTo.currentSpeed,
        unitsTo.currentDirection,
        unitsTo.battery,
        unitsTo.depth,
        null,
        unitsTo.waterLevel,
        unitsTo.currentSpeed,
        unitsTo.currentDirection,
        unitsTo.battery,
        unitsTo.depth,
        null,
      ]);
      const fileId = fileResult.rows[0]?.id;

      if (!fileId) {
        continue;
      }

      // Create dynamic table for the file
      const tableName = `tb_${fileId}`;
      const tblCreateQuery = `
        CREATE TABLE ${tableName} (
          id SERIAL PRIMARY KEY,
          station_id TEXT,
          date TIMESTAMPTZ,
          lat TEXT,
          lon TEXT,
          speed TEXT,
          direction TEXT,
          depth TEXT,
          pressure TEXT,
          battery TEXT,
          high_water_level INTEGER,
          file_id INTEGER REFERENCES tb_file(id)
        )`;
      const tblperocessed = `
        CREATE TABLE ${tableName}_processed (
          id SERIAL PRIMARY KEY,
          station_id TEXT,
          date TIMESTAMPTZ,
          lat TEXT,
          lon TEXT,
          speed TEXT,
          direction TEXT,
          depth TEXT,
          pressure TEXT,
          battery TEXT,
          high_water_level INTEGER,
          file_id INTEGER REFERENCES tb_file(id)
        )`;
      const tbCreateResult = await pool.query(tblCreateQuery);
      const tbCreateProcessed = await pool.query(tblperocessed);

      if (
        tbCreateResult.command !== "CREATE" &&
        tbCreateProcessed.command !== "CREATE"
      ) {
        continue; // Skip if table creation failed
      }

      // Insert all rows into the dynamic table
      const insertQuery = `
        INSERT INTO ${tableName} (
          station_id, date, lat, lon, speed, direction, depth, pressure, battery, high_water_level, file_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11)`;
      const insertQuery_processed = `
        INSERT INTO ${tableName}_processed (
          station_id, date, lat, lon, speed, direction, depth, pressure, battery, high_water_level, file_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11)`;

      for (const row of fileData) {
        const values = [
          row.station_id,
          row.date,
          row.lat,
          row.lon,
          row.speed,
          row.direction,
          row.depth,
          +(parseFloat(row.pressure) * 0.9945).toFixed(4),
          row.battery,
          row.high_water_level,
          fileId,
        ];
        await pool.query(insertQuery, values);
        await pool.query(insertQuery_processed, values);
      }

      insertedFiles.push({ file_name: fname, file_id: fileId });
    }

    return res.status(200).json({
      status: "Success",
      message: "Folder, files, and data inserted successfully",
      folder_id: folderId,
      files: insertedFiles,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "failed",
      message: error.message || "Unexpected error occurred",
    });
  }
};

// login page api
//get the count of the users
const getUser = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM user_tb");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//check for the matches
const checkusername = async (req, res) => {
  const { user_name, email_id } = req.body;
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS count FROM user_tb WHERE user_name = $1",
      [user_name]
    );
    const email_result = await pool.query(
      "SELECT COUNT(*) AS count FROM user_tb WHERE email_id = $1",
      [email_id]
    );
    res.json({
      usernameExists: result.rows[0].count > 0,
      emailExists: email_result.rows[0].count > 0,
    });
  } catch (error) {
    console.error("Error in checkUsername:", error);
    res.status(500).json({ message: "Error checking username." });
  }
};

//Add the user
const signup = async (req, res) => {
  const { user_name, password, email_id } = req.body;
  console.log("Incoming user:", req.body);
  const encrypt_password = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO user_tb (user_name,password,email_id) VALUES ($1, $2, $3)",
      [user_name, encrypt_password, email_id]
    );
    res.status(201).send("User added");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//check the username and password to access
const loginUser = async (req, res) => {
  const { user_name, password } = req.body;
  console.log("Attempting login for:", user_name);

  try {
    const result = await pool.query(
      "SELECT * FROM user_tb WHERE user_name = $1",
      [user_name]
    );

    if (result.rows.length === 0) {
      console.log("No user found");
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];
    console.log("Found user:", user.user_name);

    // ✅ Use bcrypt to compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    console.log("Login successful");
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

//check the username and email exists

const forget_password = async (req, res) => {
  const { user_name, email_id } = req.body;

  try {
    // Check if username exists
    const userResult = await pool.query(
      "SELECT * FROM user_tb WHERE user_name = $1",
      [user_name]
    );

    if (userResult.rows.length === 0) {
      return res.json({ valid: false, reason: "username" });
    }

    // Check if email matches the found user
    const emailMatch = userResult.rows.find((u) => u.email_id === email_id);
    if (!emailMatch) {
      return res.json({ valid: false, reason: "email" });
    }

    res.json({ valid: true });
  } catch (err) {
    console.error("Forget password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//change the password

const change_password = async (req, res) => {
  const { user_name, newPassword } = req.body;
  const encrypt_password = await bcrypt.hash(newPassword, 10);

  console.log("res", req.body);
  try {
    await pool.query("UPDATE user_tb SET password = $1 WHERE user_name = $2", [
      encrypt_password,
      user_name,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const addNewRow = async (req, res) => {
  const { speed, direction, tide, timestamp, file_id } = req.body;
  if (!file_id || !speed || !direction || !tide || !timestamp) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const data = await pool.query(
      `SELECT * FROM tb_${file_id}_processed ORDER BY RANDOM() LIMIT 1`
    );
    if (!data.rows.length) {
      return res.status(404).json({ message: "No data found in table" });
    }

    const result = await pool.query(
      `INSERT INTO tb_${file_id}_processed (station_id, date, speed, direction, depth, pressure, battery, file_id, lat, lon, high_water_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        data.rows[0].station_id,
        timestamp,
        speed,
        direction,
        data.rows[0].depth,
        tide,
        data.rows[0].battery,
        data.rows[0].file_id,
        data.rows[0].lat,
        data.rows[0].lon,
        0,
      ]
    );

    await pool.query(`UPDATE tb_file SET is_processed = true WHERE id = $1`, [
      file_id,
    ]);

    res.status(200).json({ message: "Row added successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error}` });
  }
};

const updateData = async (req, res) => {
  try {
    const updatePayload = req.body;

    if (!Array.isArray(updatePayload) || updatePayload.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payload. Expected an array of objects with id and updated values.",
      });
    }

    const updatePromises = updatePayload.map(async (item) => {
      const { id, speed, direction, pressure, file_id } = item;

      if (!id || !file_id) {
        throw new Error("Each update item must include an id and file_id");
      }

      const updateObj = {};
      if (speed !== undefined) updateObj.speed = speed;
      if (direction !== undefined) updateObj.direction = direction;
      if (pressure !== undefined) updateObj.pressure = pressure;

      return new Promise((resolve, reject) => {
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(updateObj).forEach(([key, value]) => {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        });

        // Add id as the last parameter
        values.push(id);

        const query = `UPDATE tb_${file_id}_processed SET ${setClauses.join(
          ", "
        )} WHERE id = $${paramIndex}`;

        pool
          .query(query, values)
          .then((result) => {
            resolve({ id, affected: result.rowCount });
          })
          .catch((err) => {
            console.error(`Error updating row with id ${id}:`, err);
            reject(err);
          });
      });
    });

    const results = await Promise.all(updatePromises);
    const totalUpdated = results.reduce((sum, item) => sum + item.affected, 0);

    await pool.query(`UPDATE tb_file SET is_processed = true WHERE id = $1`, [
      updatePayload[0].file_id,
    ]);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${totalUpdated} records`,
      results,
    });
  } catch (error) {
    console.error("Error in updateData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update data",
      error: error.message,
    });
  }
};

const getDataByFolderIdAndFileName = async (req, res) => {
  const { file_id } = req.params;
  console.log(req.params);
  try {
    const result = await pool.query(
      `SELECT
         tp.*, tf.water_level_unit, tf.current_speed_unit, tf.current_direction_unit,
         tf.battery_unit, tf.depth_unit, tf.coord_unit, tf.water_level_unit_to, tf.current_speed_unit_to,
         tf.current_direction_unit_to, tf.battery_unit_to, tf.depth_unit_to, tf.coord_unit_to
       FROM
         tb_${file_id} tp
       JOIN
         tb_file tf ON tf.id = tp.file_id
       ORDER BY
         tp.date ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

const getProcessedDataByFileId = async (req, res) => {
  const { file_id } = req.params;
  console.log(req.params);
  try {
    const result = await pool.query(
      `SELECT
         tp.*, tf.water_level_unit, tf.current_speed_unit, tf.current_direction_unit,
         tf.battery_unit, tf.depth_unit, tf.coord_unit, tf.water_level_unit_to, tf.current_speed_unit_to,
         tf.current_direction_unit_to, tf.battery_unit_to, tf.depth_unit_to, tf.coord_unit_to
       FROM
         tb_${file_id}_processed tp
       JOIN
         tb_file tf ON tf.id = tp.file_id
       ORDER BY
         tp.date ASC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

// const getFoldersWithFiles = async (req, res) => {
//   try {
//     const query = `
//       SELECT
//         f.id AS folder_id,
//         f.folder_name,
//         fi.id AS file_id,
//         fi.file_name,
//         fi.is_processed,
//         fi.water_level_unit,
//         fi.current_speed_unit,
//         fi.current_direction_unit,
//         fi.battery_unit,
//         fi.depth_unit,
//         fi.coord_unit,
//         fi.water_level_unit_to,
//         fi.current_speed_unit_to,
//         fi.current_direction_unit_to,
//         fi.battery_unit_to,
//         fi.depth_unit_to,
//         fi.coord_unit_to,
//         MAX(tp.date) AS max_date,
//         MIN(tp.date) AS min_date
//       FROM
//         tb_folders f
//       JOIN
//         tb_file fi ON fi.folder_id = f.id
//       JOIN
//         tb_${f.id} tp ON tp.file_id = fi.id
//       ORDER BY
//         f.id DESC
//     `;
//     const result = await pool.query(query);
//     const foldersMap = {};
//     result.rows.forEach((row) => {
//       if (!foldersMap[row.folder_id]) {
//         foldersMap[row.folder_id] = {
//           folder_id: row.folder_id,
//           folder_name: row.folder_name,
//           files: [],
//         };
//       }
//       if (row.file_id) {
//         foldersMap[row.folder_id].files.push({
//           file_id: row.file_id,
//           file_name: row.file_name,
//           is_processed: row.is_processed,
//           water_level_unit: row.water_level_unit,
//           current_speed_unit: row.current_speed_unit,
//           current_direction_unit: row.current_direction_unit,
//           battery_unit: row.battery_unit,
//           depth_unit: row.depth_unit,
//           coord_unit: row.coord_unit,
//           water_level_unit_to: row.water_level_unit_to,
//           current_speed_unit_to: row.current_speed_unit_to,
//           current_direction_unit_to: row.current_direction_unit_to,
//           battery_unit_to: row.battery_unit_to,
//           depth_unit_to: row.depth_unit_to,
//           coord_unit_to: row.coord_unit_to,
//           max_date: row.max_date,
//           min_date: row.min_date,
//         });
//       }
//     });
//     const foldersWithFiles = Object.values(foldersMap).sort(
//       (a, b) => b.folder_id - a.folder_id
//     );
//     res.status(200).json({ data: foldersWithFiles });
//   } catch (error) {
//     res.status(500).json({ message: `Error: ${error.message}` });
//   }
// };
const getFoldersWithFiles = async (req, res) => {
  try {
    // 1️⃣ Fetch all folders and their files (fixed tables)
    const baseQuery = `
      SELECT
        f.id AS folder_id,
        f.folder_name,
        fi.id AS file_id,
        fi.file_name,
        fi.is_processed,
        fi.water_level_unit,
        fi.current_speed_unit,
        fi.current_direction_unit,
        fi.battery_unit,
        fi.depth_unit,
        fi.coord_unit,
        fi.water_level_unit_to,
        fi.current_speed_unit_to,
        fi.current_direction_unit_to,
        fi.battery_unit_to,
        fi.depth_unit_to,
        fi.coord_unit_to
      FROM tb_folders f
      JOIN tb_file fi ON fi.folder_id = f.id
      ORDER BY f.id DESC
    `;

    const result = await pool.query(baseQuery);
    const foldersMap = {};

    // 2️⃣ Prepare an array of promises to fetch min/max dates in parallel
    const dateQueries = result.rows.map(async (row) => {
      const folderId = row.folder_id;
      const fileId = row.file_id;
      const tableName = `tb_${fileId}`; // dynamic table name

      let minDate = null;
      let maxDate = null;

      try {
        const dateQuery = `
          SELECT
            MIN(date) AS min_date,
            MAX(date) AS max_date
          FROM ${tableName}
          WHERE file_id = $1
        `;
        const dateRes = await pool.query(dateQuery, [fileId]);
        if (dateRes.rows.length > 0) {
          minDate = dateRes.rows[0].min_date;
          maxDate = dateRes.rows[0].max_date;
        }
      } catch (err) {
        console.warn(`⚠️ Skipping ${tableName}: ${err.message}`);
      }

      // Group files under their folder
      if (!foldersMap[folderId]) {
        foldersMap[folderId] = {
          folder_id: folderId,
          folder_name: row.folder_name,
          files: [],
        };
      }

      foldersMap[folderId].files.push({
        ...row,
        min_date: minDate,
        max_date: maxDate,
      });
    });

    // 3️⃣ Wait for all queries to complete in parallel
    await Promise.all(dateQueries);

    // 4️⃣ Sort folders (latest first)
    const foldersWithFiles = Object.values(foldersMap).sort(
      (a, b) => b.folder_id - a.folder_id
    );

    res.status(200).json({ data: foldersWithFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

const getAllFoldersWithFiles = async (req, res) => {
  try {
    const query = `
      SELECT
        f.id AS folder_id,
        f.folder_name,
        fi.id AS file_id,
        fi.file_name,
        fi.is_processed,
        fi.water_level_unit,
        fi.current_speed_unit,
        fi.current_direction_unit,
        fi.battery_unit,
        fi.depth_unit,
        fi.coord_unit,
        fi.water_level_unit_to,
        fi.current_speed_unit_to,
        fi.current_direction_unit_to,
        fi.battery_unit_to,
        fi.depth_unit_to,
        fi.coord_unit_to
      FROM
        tb_folders f
      LEFT JOIN
        tb_file fi ON fi.folder_id = f.id
      ORDER BY
        f.id DESC
    `;
    const result = await pool.query(query);
    const foldersMap = {};
    result.rows.forEach((row) => {
      if (!foldersMap[row.folder_id]) {
        foldersMap[row.folder_id] = {
          folder_id: row.folder_id,
          folder_name: row.folder_name,
          files: [],
        };
      }
      if (row.file_id) {
        foldersMap[row.folder_id].files.push({
          file_id: row.file_id,
          file_name: row.file_name,
          is_processed: row.is_processed,
          water_level_unit: row.water_level_unit,
          current_speed_unit: row.current_speed_unit,
          current_direction_unit: row.current_direction_unit,
          battery_unit: row.battery_unit,
          depth_unit: row.depth_unit,
          coord_unit: row.coord_unit,
          water_level_unit_to: row.water_level_unit_to,
          current_speed_unit_to: row.current_speed_unit_to,
          current_direction_unit_to: row.current_direction_unit_to,
          battery_unit_to: row.battery_unit_to,
          depth_unit_to: row.depth_unit_to,
          coord_unit_to: row.coord_unit_to,
        });
      }
    });
    const foldersWithFiles = Object.values(foldersMap).sort(
      (a, b) => b.folder_id - a.folder_id
    );
    res.status(200).json({ data: foldersWithFiles });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

const changeFolder = async (req, res) => {
  const { file_id, folder_id } = req.body;

  if (!file_id || !folder_id) {
    return res
      .status(400)
      .json({ message: "file_id and folder_id are required." });
  }

  try {
    // Check if file exists
    const checkFile = await pool.query("SELECT * FROM tb_file WHERE id = $1", [
      file_id,
    ]);

    if (checkFile.rows.length === 0) {
      return res.status(404).json({ message: "File not found." });
    }

    // Update folder_id
    await pool.query("UPDATE tb_file SET folder_id = $1 WHERE id = $2", [
      folder_id,
      file_id,
    ]);

    res.status(200).json({ message: "File moved successfully." });
  } catch (err) {
    console.error("Error moving file:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const createFolder = async (req, res) => {
  const { folder_name } = req.body;

  if (!folder_name) {
    return res.status(400).json({ message: "Folder name is required" });
  }

  try {
    const insertQuery = `INSERT INTO tb_folders (folder_name) VALUES ($1) RETURNING *`;
    const result = await pool.query(insertQuery, [folder_name]);

    res
      .status(201)
      .json({ message: "Folder created successfully", folder: result.rows[0] });
  } catch (err) {
    console.error("Error adding folder:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkLicenseValidity = async (
  filePath = "C:/Apache24/conf/license.json"
) => {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.warn("License file not found");
      return { valid: false, pendingDays: 0 };
    }

    // Read and parse file
    const fileContent = await fs.readFile(filePath, "utf-8");
    const licenseData = JSON.parse(fileContent);

    const validTill = new Date(licenseData.validTill);
    const currentTime = new Date();

    if (isNaN(validTill.getTime())) {
      console.warn("Invalid date in license file");
      return { valid: false, pendingDays: 0 };
    }

    const pendingTime = validTill.getTime() - currentTime.getTime();
    const pendingDays = Math.max(
      0,
      Math.ceil(pendingTime / (1000 * 60 * 60 * 24))
    );

    return {
      valid: currentTime <= validTill,
      pendingDays,
    };
  } catch (error) {
    console.error("Error reading or parsing license file:", error);
    return { valid: false, pendingDays: 0 };
  }
};

const checkLicenseValidityHandler = async (req, res) => {
  try {
    const result = await checkLicenseValidity();
    res.status(200).json({ message: "Success", result });
  } catch (error) {
    console.error("Error checking license validity:", error);
    res.status(500).json({
      message: error.message,
      result: { valid: false, pendingDays: 0 },
    });
  }
};

const updateToUnits = async (req, res) => {
  const { file_id, unitKey, unitValue } = req.body;

  if (!file_id || !unitKey || !unitValue) {
    return res
      .status(400)
      .json({ message: "file_id, unitKey, and unitValue are required." });
  }

  const UNIT_KEY_TO_COLUMN = {
    waterLevel: "water_level_unit_to",
    currentSpeed: "current_speed_unit_to",
    currentDirection: "current_direction_unit_to",
    battery: "battery_unit_to",
    depth: "depth_unit_to",
    latandlong: "coord_unit_to",
  };

  const dbColumn = UNIT_KEY_TO_COLUMN[unitKey];

  if (!dbColumn) {
    return res.status(400).json({
      message: "Invalid unitKey.",
      validUnitKeys: Object.keys(UNIT_KEY_TO_COLUMN),
    });
  }

  try {
    const fileCheck = await pool.query("SELECT 1 FROM tb_file WHERE id = $1", [
      file_id,
    ]);

    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ message: "File not found." });
    }

    await pool.query(`UPDATE tb_file SET ${dbColumn} = $1 WHERE id = $2`, [
      unitValue,
      file_id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Unit updated successfully",
      data: { file_id, unitKey, unitValue },
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = {
  importAll,
  getFiles,
  getDataByFolderIdAndFileName,
  updateValues,
  createFolderAndFile,
  getFoldersWithFiles,
  getUser,
  loginUser,
  signup,
  forget_password,
  change_password,
  checkusername,

  addNewRow,
  updateData,
  getProcessedDataByFileId,

  changeFolder,
  createFolder,
  checkLicenseValidityHandler,
  updateToUnits,
  getAllFoldersWithFiles,
};
