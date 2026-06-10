import React, { useState, useEffect } from "react";
import axios from "axios";

function Kategori() {
    const [kategori, setKategori] = useState([]);

    useEffect(() => {
        axios.get('https://8f03-103-24-58-33.ngrok-free.app/api/kategori', {
            headers: {
                'ngrok-skip-browser-warning': 'any-value',
            }
        })
        .then(res => {
            if (res.data.status && Array.isArray(res.data.data)) {
                setKategori(res.data.data);
            } else {
                setKategori([]);
            }
        })
        .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h1>Halaman Kategori</h1>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nama Kategori</th>
                    </tr>
                </thead>
                <tbody>
                    {kategori.length > 0 ? (
                        kategori.map(item => (
                            <tr key={item.id_kategori}>
                                <td>{item.id_kategori}</td>
                                <td>{item.nama_kategori}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2">Data kosong</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Kategori;