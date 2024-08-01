'use client'
import { useState, useEffect } from 'react'
import { Box, Modal, Stack, Typography, TextField, Button } from "@mui/material";
import { firestore } from '@/firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}


export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [error, setError] = useState(null);
  const [recipe, setRecipe] = useState('');


  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push(
        {
          name: doc.id,
          ...doc.data(),
        })
    })
    setInventory(inventoryList)
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()) {
      const {quantity} = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      }
      else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }
    await updateInventory()
  }

  const addItem = async (item) => {
    item = item.charAt(0).toLowerCase() + item.slice(1)
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()) {
      const {quantity} = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1})
    }
    else {
      await setDoc(docRef, {quantity: 1})
    }
    await updateInventory()
  }

  const updateCount = async(item, count) => {
    item = item.charAt(0).toLowerCase() + item.slice(1)
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + count }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: count }, { merge: true });
    }
    await updateInventory()
  }

  const getImageDescription = async () => {
    try {
      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: "https://www.fruitsmith.com/pub/media/mageplaza/blog/post/s/e/seedless_fruits.jpg",
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("data: " + data.message.content);

      // Extract items and their counts from the description
      const items = data.message.content.match(/(\w+):\s?(\d+)/g);

      if (items) {  
        for (const item of items) {
          const [fruit, count] = item.split(':').map(str => str.trim());
          const countNumber = parseInt(count, 10);

          if (!isNaN(countNumber)) {
            await updateCount(fruit, countNumber);
          }
        }
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const formatPantry = async () => {
    let response = ''
    for (const item of inventory) {
      response += item.name + ": " + item.quantity + " "
    }
    return response
  };


  const getRecipe = async () => {
    try {
      const pantryFormatted = await formatPantry();
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: pantryFormatted,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const recipeResponse = data.message.content
      setRecipe(recipeResponse || 'No recipe available.');
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  
  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName)
                setItemName('')
                handleClose()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      <Button variant="contained" onClick={getImageDescription}>
        Get Image Description
      </Button>
      <Button variant="contained" onClick={getRecipe}>
        Get a Recipe with the Ingredients
      </Button>
      <Box
        width="800px"
        p={3}
        my={3}
        bgcolor="white"
        borderRadius={2}
        boxShadow={2}
      >
        <Typography variant="h4" color="textPrimary" gutterBottom>
          Recipe:
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {recipe}
        </Typography>
      </Box>
      <Box border={'1px solid #333'}> 
        <Box
          width="800px"
          height="100px"
          bgcolor={'#00ffae'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {inventory.map(({name, quantity}) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              p={ 2 }
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant="h6" color="textPrimary">
              {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h6" color="textPrimary">
                Quantity: {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="primary" onClick={() => addItem(name)}>
                  Add
                </Button>
                <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
