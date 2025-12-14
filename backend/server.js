import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res)=>{
    res.send("Server successfully running.");
})

const userData = [
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-02-02T14:20:00Z"
  },
  {
    "id": 3,
    "name": "Mike Johnson",
    "email": "mike.johnson@example.com",
    "role": "user",
    "isActive": false,
    "createdAt": "2024-03-10T08:45:00Z"
  }
]


app.get('/api/users', (req, res)=>{
    res.send(userData);
})

app.listen(PORT, ()=>{
    console.log(`Server running at http://localhost:${PORT}`);
})