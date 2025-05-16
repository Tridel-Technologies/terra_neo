const { poo, file } = require('fontawesome');
const { pool } = require('./db');

const importAll = async (req, res) => {
  const { data, files, folder_name } = req.body;

  if (!files || !folder_name || !Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'Invalid input data' });
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
      return res.status(500).json({ message: 'File insert failed' });
    }

    // Loop over the data and insert into tb_adcp_master
    for (let index = 0; index < data.length; index++) {
      const item = data[index];

      // Optional: Validate each item before insert
      if (
        !item.station_id || !item.DateTime  ||
        item.speed == null || item.direction == null ||
        item.depth == null || item.pressure == null || item.battery == null
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
          item.file_name
        ]
      );
    }

    res.status(200).json({
      message: 'File and data imported successfully',
      file_id,
      rowsInserted: data.length
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getFiles = async(req, res)=>{
    try {
        const result = await pool.query(`SELECT * FROM tb_folders`);
        res.status(200).json({
            data:result.rows
        })
    } catch (error) {
        res.status(500).json({message:`Error: ${error}`})
    }
}
const getFoldersWithFiles = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id AS folder_id,
        f.folder_name,
        fi.id AS file_id,
        fi.file_name
      FROM 
        tb_folders f
      LEFT JOIN 
        tb_file fi ON fi.folder_id = f.id
      ORDER BY 
        f.id, fi.id;
    `;
    const result = await pool.query(query);
    const foldersMap = {};
    result.rows.forEach(row => {
      if (!foldersMap[row.folder_id]) {
        foldersMap[row.folder_id] = {
          folder_id: row.folder_id,
          folder_name: row.folder_name,
          files: []
        };
      }
      if (row.file_id) {
        foldersMap[row.folder_id].files.push({
          file_id: row.file_id,
          file_name: row.file_name
        });
      }
    });
    const foldersWithFiles = Object.values(foldersMap);
    res.status(200).json({ data: foldersWithFiles });
  } catch (error) {
    res.status(500).json({ message: `Error: ${error.message}` });
  }
};

const getDataByFolderIdAndFileName = async (req, res) => {
    const { file_id } = req.params;  // Accept folder_id and file_name as params
    console.log(req.params)
    try {
      const result = await pool.query(
        `SELECT 
           *
         FROM 
           tb_${file_id}
         `,  
      );
      res.status(200).json(result.rows);
  
    } catch (err) {
      console.error('Fetch error:', err);
      res.status(500).json({ message: 'Error fetching data', error: err.message });
    }
  };
 const updateValues = async (req, res) => {
  const { file_name, lat, lon, high_water_level } = req.body;

  if (!file_name || !Array.isArray(file_name) || file_name.length === 0) {
    return res.status(400).json({ error: 'file_name (array) is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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
          SET ${fields.join(', ')}
        `;
        const updateQuery2 = `
          UPDATE tb_${file.file_id}_processed
          SET ${fields.join(', ')}
        `;

        await client.query(updateQuery, values);
        await client.query(updateQuery2, values);
      }
    }

    // ✅ Step 2: Update high_water_level if timestamp provided (only in one table)
    if (high_water_level) {
      const isValidFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(high_water_level);
      if (!isValidFormat) {
        throw new Error('Invalid high_water_level format. Expected YYYY-MM-DD HH:MM:SS');
      }

      const targetTable = `tb_${file_name[0].file_id}`;

      // Reset all rows
      await client.query(`UPDATE ${targetTable} SET high_water_level = 0`);

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

    await client.query('COMMIT');
    res.json({ message: 'Update successful' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating ADCP:', error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  } finally {
    client.release();
  }
};

const createFolderAndFile = async (req, res) => {
  const { folder_name, file_name, data } = req.body;

  if (!folder_name || !Array.isArray(file_name) || typeof data !== "object") {
    return res.status(400).json({ message: "Invalid input format" });
  }

  try {
    // 1. Insert folder
    const folderInsertQuery = `INSERT INTO tb_folders (folder_name) VALUES($1) RETURNING id`;
    const folderResult = await pool.query(folderInsertQuery, [folder_name]);

    const folderId = folderResult.rows[0]?.id;
    if (!folderId) {
      return res.status(500).json({ status: "failed", message: "Folder creation failed" });
    }

    const insertedFiles = [];

    // 2. Loop through each file and handle insertions
    for (const fname of file_name) {
      const fileData = data[fname];

      if (!Array.isArray(fileData)) {
        continue; // Skip invalid data for this file
      }

      // Insert file
      const fileInsertQuery = `INSERT INTO tb_file (file_name, folder_id) VALUES ($1, $2) RETURNING id`;
      const fileResult = await pool.query(fileInsertQuery, [fname, folderId]);
      const fileId = fileResult.rows[0]?.id;

      if (!fileId) {
        continue; // Skip this file if insert failed
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
      const tblperocessed =  `
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
      const tbCreateProcessed = await pool.query(tblperocessed)

      if (tbCreateResult.command !== 'CREATE' && tbCreateProcessed.command !== 'CREATE') {
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
          row.pressure,
          row.battery,
          0,
          fileId
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
      files: insertedFiles
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "failed",
      message: error.message || "Unexpected error occurred"
    });
  }
};


module.exports = {
  importAll,
  getFiles,
  getDataByFolderIdAndFileName,
  updateValues,
  createFolderAndFile,
  getFoldersWithFiles
};
