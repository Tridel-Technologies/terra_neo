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
