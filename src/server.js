
import express from 'express';
import 'dotenv/config';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Test the API
app.get('/', (req, res) => {
    res.json({ message: 'Cars API is running!' });
});

// Get cars list
app.get('/api/getAllCars', async (req, res) => {
    try {
        const cars = await pool.query('SELECT * FROM cars ORDER BY id');
        return res.json(cars.rows);
    } catch (error) {
        console.log("error while fetching data", error?.message);
        return res.status(500).json({ error: 'failed to fetch data' });
    }
});

// add new single car
app.post('/api/createCar', async (req, res) => {
    const { brand, model, year } = req.body;
    try {
        const result = pool.query(
            `INSERT INTO cars (brand,model,year)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [brand.trim(), model.trim(), year ?? null]
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        console.log("error while adding new car details: ", error.message);
        return res.status(500).json({ error: 'failed to create car' });
    }
});

// update existing car details
app.put('/api/updateCarDetails/:id', async (req, res) => {
    const { id } = req.params;
    const { brand, model, year } = req.body;
    try {
        await pool.query(
            `UPDATE cars
            SET brand=$1,
                model=$2,
                year=$3
            WHERE id=$4`,
            [brand, model, year, id]
        );
        return res.status(500).json({ message: 'row updated successfully' });
    } catch (error) {
        console.log('failed to update car details:', error.message);
        return res.status(500).json({ error: 'failed to update car details' });
    }
});

// update part of car details brand or year or model
app.patch('/api/updateCarDetails/:id', async (req, res) => {
    const { id } = req.params;
    const { brand, model, year } = req.body;
    const fields = [];
    const values = [];
    if (brand) {
        values.push(brand);
        fields.push(`brand = $${values.length}`);
    }

    if (model) {
        values.push(model);
        fields.push(`model = $${values.length}`);
    }

    if (year) {
        values.push(year);
        fields.push(`year = $${values.length}`)
    }

    if (id) {
        values.push(id)
    }

    try {
        await pool.query(
            `UPDATE cars 
        SET ${fields.join(',')}
        WHERE id=$${values.length}`,
            values);
        res.status(200).json({ message: 'Requested fields updated successfully' })
    } catch (error) {
        console.log('Failed to update requested fields:', error.message)
    }
});

// Delete car details from table
app.delete('/api/deleteCarDetails/:id', async (req, res) => {
    const { id } = req.params;
    try {
       await pool.query(`
            DELETE FROM cars 
            WHERE id=${id}
            `);
        res.status(200).json({message: 'car details deleted successfully'});
    } catch (error) {
        console.log('Failed to failed to delete car details:', error.message)
        res.status(500).json({ message: 'Car is not deleted due to internal issues' });
    }
});

async function startServer() {
    try {
        await pool.query('SELECT 1');
        app.listen(PORT, () => {
            console.log('server running at port http://localhost:', PORT)
        })
    } catch (error) {
        console.log('data base connection failed:', error.message);
        process.exitCode = 1;
    }
}

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        inet_server_port() AS server_port
    `);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

startServer();
