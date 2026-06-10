import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditProduk() {
    const [kategori, setKategori] = useState([]);
    const [nama, setNamaProduk] = useState("");
    const [kategoriId, setKategoriId] = useState("");
    const [gambarLama, setGambarLama] = useState("");

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3500/api/kategori')
        .then(res => res.data.status && setKategori(res.data.data.data))
        .catch(err => console.error(err));

        axios.get(`http://localhost:3500/api/produk/${id}`)
        .then(res => {
            if(res.data.status){
                const data = res.data.data[0];
                setNamaProduk(data.nama_produk);
                setKategoriId(data.kategori_id);
                setGambarLama(data.gambar_produk);
            }
        })
        .catch(err => console.error(err));

    }, [id])

    const [gambar, setGambar] = useState(null);

    const Submit = (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("nama_produk", nama);
        data.append("kategori_id", kategoriId);
        if(gambar){
            data.append("gambar_produk", gambar);
        }

        axios.patch(`http://localhost:3500/api/produk/update/${id}`, data)
        .then(res => {
            if(res.data.status){
                alert("Produk berhasil diperbarui");
                navigate("/produk");
            }else{
                alert("Gagal memperbarui produk");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Terjadi kesalahan saat mengupdate");
        });
    };
    
    return(
        
        <div>
            <h1>Edit Produk</h1>
            <form onSubmit={Submit} >
                <label>Namaaa</label>
                <input type="text" value={nama} onChange={e => setNamaProduk(e.target.value)} /> <br/>
                <label>Kategori</label>
                <select value={kategoriId} onChange={e => setKategoriId(e.target.value)}>
                    {kategori.map(item => (
                        <option key={item.id_kategori} value={item.id_kategori}>
                            {item.nama_kategori}
                        </option>
                    ))}
                </select><br/>
                <label>Gambar</label>
                <input type="file" onChange={e => setGambar(e.target.files[0])} /> <br/>
                {gambarLama && (
                    <div>
                        <img src={`http://localhost:3500/images/${gambarLama}`} height="100" />
                    </div>
                )}
                <button type="submit">Update</button>
            </form>
        </div>
        
    );
    
}

export default EditProduk;