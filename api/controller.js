const { poo } = require('fontawesome');
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
        !item.station_id || !item.Date || !item.Time ||
        item.speed == null || item.direction == null ||
        item.depth == null || item.pressure == null || item.battery == null
      ) {
        console.warn(`Skipping invalid row at index ${index}:`, item);
        continue;
      }

      await pool.query(
        `INSERT INTO tb_adcp_master (
          station_id, date, time, speed, direction, dept, pressure, battery, file_id, file_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          item.station_id,
          item.Date,
          item.Time,
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


const getFiles = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM tb_files`);
    res.status(200).json({
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({ message: `Error: ${error}` })
  }
}

const getDataByFolderIdAndFileName = async (req, res) => {
  const { folder_id, file_name } = req.params;  // Accept folder_id and file_name as params
  console.log(req.params)
  try {
    const result = await pool.query(
      `SELECT 
           *
         FROM 
           tb_adcp_master d
         WHERE 
           file_id = $1 AND file_name = $2`,  // Use folder_id and file_name in WHERE clause
      [folder_id, file_name]  // Pass both folder_id and file_name as query parameters
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

    // Step 1: Update lat/lon based on file_name array
    const fields = [];
    const values = [];
    let index = 1;

    if (lat !== undefined) {
      fields.push(`lat = $${index++}`);
      values.push(lat);
    }

    if (lon !== undefined) {
      fields.push(`lon = $${index++}`);
      values.push(lon);
    }

    if (fields.length > 0) {
      values.push(file_name); // $index
      const updateQuery = `
          UPDATE tb_adcp_master
          SET ${fields.join(', ')}
          WHERE file_name = ANY($${index})
        `;
      await client.query(updateQuery, values);
    }

    // Step 2: If high_water_level timestamp is provided, update accordingly
    if (high_water_level) {
      const [dateStr, timeStr] = high_water_level.split(' '); // '2025-04-30', '09:10:00'
      console.log("Using exact date/time:", dateStr, timeStr);

      await client.query(`UPDATE tb_adcp_master SET high_water_level = 0`);

      await client.query(
        `UPDATE tb_adcp_master 
           SET high_water_level = 1 
           WHERE date::date = $1 
             AND time = $2 
             AND file_name = $3`,
        [dateStr, timeStr, file_name[0]]
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

const addNewRow = async (req, res) => {
  const { id, speed, direction, tide, timestamp } = req.body;
  try {
    const data = await pool.query(`SELECT * FROM tb_adcp_master WHERE id = $1`, [id])

    const result = await pool.query(
      `INSERT INTO tb_adcp_master (station_id, date, speed, direction, dept, pressure, battery, file_id, file_name, lat, lon, high_water_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [data.rows[0].station_id, timestamp, speed, direction, data.rows[0].dept, tide, data.rows[0].battery, data.rows[0].file_id, data.rows[0].file_name, data.rows[0].lat, data.rows[0].lon, 0]
    );
    res.status(200).json({ message: "Row added successfully" })
  } catch (error) {
    res.status(500).json({ message: `Error: ${error}` })
  }

};

const updateData = async (req, res) => {
  try {
    const updatePayload = req.body;

    if (!Array.isArray(updatePayload) || updatePayload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload. Expected an array of objects with id and updated values."
      });
    }

    const updatePromises = updatePayload.map(async (item) => {
      const { id, speed, direction, pressure } = item;

      if (!id) {
        throw new Error("Each update item must include an id");
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

        const query = `UPDATE tb_adcp_master SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

        pool.query(query, values)
          .then(result => {
            resolve({ id, affected: result.rowCount });
          })
          .catch(err => {
            console.error(`Error updating row with id ${id}:`, err);
            reject(err);
          });
      });
    });

    const results = await Promise.all(updatePromises);
    const totalUpdated = results.reduce((sum, item) => sum + item.affected, 0);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${totalUpdated} records`,
      results
    });
  } catch (error) {
    console.error("Error in updateData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update data",
      error: error.message
    });
  }
};





module.exports = {
  importAll,
  getFiles,
  getDataByFolderIdAndFileName,
  updateValues,
  addNewRow,
  updateData
};
