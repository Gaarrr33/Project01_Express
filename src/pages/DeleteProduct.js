import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
function DeleteProduk({id}){
    const navigate = useNavigate();

    const handleDelete = () => {
        const confirmDelete = window.confirm("Yakin....?");
        if (confirmDelete) {
            axios.delete(`http://localhost:3500/api/produk/delete/${id}`)
                .then(res => {
                    if (res.data.status) {
                        alert("berhasil hapus data.");
                        navigate("/produk");
                        window.location.reload();
                    } else {
                        alert("Gagal hapus.");
                    }
                })
                .catch(err => {
                    console.error("Error:", err);
                    alert("Terjadi kesalahan pada handle");
                });
        }
    };
    return(
        <button onClick={handleDelete} >
         Hapus
        </button>
    );
}

export default DeleteProduk;