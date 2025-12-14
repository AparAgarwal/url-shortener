import { useState } from 'react'
import './App.css'
import axios from 'axios'
import { useEffect } from 'react';

function App() {
  // sample backend-frontend integration.
  const [users, setUsers] = useState([]);

  useEffect(()=>{
    axios.get('/api/users').then((res)=>{
      setUsers(res.data)
    })
    .catch((error)=>{
      console.log(error)
    })
  })

  return (
    <>
      <h1>Hello World</h1>
      <p>Total Users : {users.length}</p>
      {
        users.map((user)=> (
          <div key={user.id}>
            <h1>{user.name}</h1>
            <h3>{user.role}</h3>
            <p>{user.email}</p>
          </div>
        ))
      }
    </>
  )
}

export default App
