const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const userRouter = require('./router');

const app = express();
const PORT = process.env.PORT || 3000;

// Fix CORS for Angular
app.use(cors());

// Increase payload limits
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// DB Connection
connectDB();

// Routes
app.use('/api', userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
