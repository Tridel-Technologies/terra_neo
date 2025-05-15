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


const getFiles = async(req, res)=>{
    try {
        const result = await pool.query(`SELECT * FROM tb_files`);
        res.status(200).json({
            data:result.rows
        })
    } catch (error) {
        res.status(500).json({message:`Error: ${error}`})
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
const checkusername=async(req,res)=>{
const{user_name, email_id}=req.body
    try {
      const result = await pool.query(
        'SELECT COUNT(*) AS count FROM user_tb WHERE user_name = $1',
        [user_name]
      );
      const email_result = await pool.query(
        'SELECT COUNT(*) AS count FROM user_tb WHERE email_id = $1',
        [email_id]
      );
      res.json({
      usernameExists: result.rows[0].count > 0,
      emailExists: email_result.rows[0].count > 0
    });
    } catch (error) {
      console.error('Error in checkUsername:', error);
      res.status(500).json({ message: 'Error checking username.' });
    }
};


//Add the user
const signup = async (req, res) => {
  const { user_name,password,email_id } = req.body;
  console.log('Incoming user:', req.body);
  const encrypt_password = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO user_tb (user_name,password,email_id) VALUES ($1, $2, $3)',
      [user_name,encrypt_password,email_id ]
    );
    res.status(201).send('User added');
  } catch (err) {
    res.status(500).send(err.message);
  }
};

//check the username and password to access
const loginUser = async (req, res) => {
  const { user_name, password } = req.body;
  console.log("Attempting login for:", user_name);

  try {
    const result = await pool.query('SELECT * FROM user_tb WHERE user_name = $1', [user_name]);

    if (result.rows.length === 0) {
      console.log("No user found");
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    console.log("Found user:", user.user_name);

    // ✅ Use bcrypt to compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });

    }
    console.log("Login successful");
    res.status(200).json({ message: 'Login successful', user });
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
      'SELECT * FROM user_tb WHERE user_name = $1',
      [user_name]
    );

    if (userResult.rows.length === 0) {
      return res.json({ valid: false, reason: 'username' });
    }

    // Check if email matches the found user
    const emailMatch = userResult.rows.find(u => u.email_id === email_id);
    if (!emailMatch) {
      return res.json({ valid: false, reason: 'email' });
    }

    res.json({ valid: true });
  } catch (err) {
    console.error('Forget password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//change the password

const change_password=async(req,res)=>{
   const { user_name, newPassword } = req.body;
  const encrypt_password = await bcrypt.hash(newPassword, 10);

   console.log("res",req.body)
  try {
    await pool.query(
      'UPDATE user_tb SET password = $1 WHERE user_name = $2',
      [encrypt_password, user_name]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

  

module.exports = {
  importAll,
  getFiles,
  getDataByFolderIdAndFileName,
  updateValues,
  getUser,
  loginUser,
  signup,
  forget_password,
  change_password,
  checkusername
};
