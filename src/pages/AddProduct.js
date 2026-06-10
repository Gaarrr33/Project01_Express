import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 

function AddProduct(){
    const [kategori, setKategori] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:3500/api/kategori')
        .then(res => res.data.status && setKategori(res.data.data.data))
        .catch(err => console.error(err));
    }, []);

    const [nama, setNamaProduk] = useState("");
    const [kategoriId, setKategoriId] = useState("");
    const [gambar, setGambar] = useState(null);

    const navigate = useNavigate();

    const Submit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("nama_produk", nama);
        data.append("kategori_id", kategoriId);
        data.append("gambar_produk", gambar);

        axios.post("http://localhost:3500/api/produk/store", data)
        .then(res => {
            if(res.data.status){
                alert("berhasil..");
                navigate("/produk");
            }else{
                alert("gagal..");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Terjadi kesalahan saat menyimpan");
        });
    };

return(
        <div>
            <h2>Tambah data produk</h2>
            <form onSubmit={Submit}>
                <label>Nama</label>
                <input type="text" onChange={e => setNamaProduk(e.target.value)} /> <br/>
                <label>Kategori</label>
                <select onChange={e => setKategoriId(e.target.value)}>
                    {kategori.map(item => (
                        <option key={item.id_kategori} value={item.id_kategori}>
                            {item.nama_kategori}
                        </option>
                    ))}
                </select><br/>
                <label>Gambar</label>
                <input type="file" onChange={e => setGambar(e.target.files[0])} /> <br/>
                <button type="submit">Simpan</button>
            </form>
                    <td><a onClick={() => navigate('/produk/edit/${item.id}')}>edit</a>
                    <DeleteProduk id={item.id} /> 
                    </td>
        </div>
    );
}

export default AddProduct;