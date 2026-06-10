import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Kategori from './pages/Kategori';
import Produk from './pages/Produk';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
function App() {
  return (
   <BrowserRouter>
     <Nav />
     <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/kategori" element={<Kategori />} />
       <Route path="/produk" element={<Produk />} />
       <Route path="/produk/tambah" element={<AddProduct />} />
       <Route path="/produk/edit/:id" element={<EditProduct />} />
     </Routes>
   </BrowserRouter>
  );
}

export default App;
