// CONFIGURATION FIREBASE ASLI MILIKMU
const firebaseConfig = {
    apiKey: "AIzaSyDiB5OzbszFLTI9cGulNVYoywp7_0f3Dkc",
    authDomain: "stayvibe-f52d4.firebaseapp.com",
    databaseURL: "https://stayvibe-f52d4-default-rtdb.firebaseio.com", 
    projectId: "stayvibe-f52d4",
    storageBucket: "stayvibe-f52d4.firebasestorage.app",
    messagingSenderId: "866844470458",
    appId: "1:866844470458:web:b84ff7faf9a746b43da683",
    measurementId: "G-CCN7FW8Q78"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let propertyDatabase = [];
let selectedPropertyIndex = -1;

// DETEKSI OTOMATIS BERDASARKAN URL HALAMAN AKTIF
const isOwnerPage = window.location.pathname.includes("dashboard-owner.html");
let activeOwnerId = ""; // Menyimpan ID Owner yang sedang verifikasi di session saat ini

// REAL-TIME LISTENER DATABASE FIREBASE
database.ref('properties').on('value', (snapshot) => {
    const data = snapshot.val();
    propertyDatabase = [];
    
    if (data) {
        Object.keys(data).forEach(key => {
            propertyDatabase.push({
                id: key,
                ...data[key]
            });
        });
        
        // Cek halaman dan panggil fungsi render yang sesuai
        if (isOwnerPage) {
            renderOwnerProperties(propertyDatabase);
        } else {
            renderProperties(propertyDatabase);
            if(selectedPropertyIndex === -1 && propertyDatabase.length > 0) {
                selectProperty(0);
            }
        }
    } else {
        const emptyMsg = `<p style="color: #8A8F98; grid-column: 1/-1; text-align: center; padding: 40px;">Database kosong.</p>`;
        if (isOwnerPage) {
            renderOwnerProperties([]); // Supaya form login verifikasi tetap muncul walaupun database kosong
        } else {
            document.getElementById('catalog-grid').innerHTML = emptyMsg;
        }
    }
});

// RENDER UNTUK HALAMAN USER (PELANGGAN)
function renderProperties(data) {
    const grid = document.getElementById('catalog-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    data.forEach((item, index) => {
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
        const syariahClass = item.regulasi === "Syariah" ? "badge-syariah" : "";

        grid.innerHTML += `
            <div class="card">
                <div class="card-img" style="background-image: url('${item.img}')">
                    <span class="badge-right ${syariahClass}">${item.regulasi} - ${item.roomType}</span>
                </div>
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <p>📍 Kota: ${item.city}<br>💰 Harga: <strong>${formattedPrice}</strong>/malam<br>🏷️ ${item.tags}</p>
                    <button class="btn-neon" onclick="selectProperty(${index})">Ulasan & Detail</button>
                </div>
            </div>
        `;
    });
}

// JEMBATAN GLOBAL AGAR KLIK DARI FILTER/KODE BARU INDEX.HTML TETAP TERBACA BESERTA INDEKSNYA
window.pilihDetailProperti = function(firebaseId) {
    if (propertyDatabase && propertyDatabase.length > 0) {
        const targetIndex = propertyDatabase.findIndex(item => item.id === firebaseId);
        if (targetIndex !== -1) {
            selectProperty(targetIndex);
            // Otomatis gulir layar ke bagian detail info
            const detailView = document.getElementById('view-title');
            if (detailView) detailView.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

// RENDER UNTUK DASHBOARD OWNER (DENGAN COCOK ID & FITUR PROTEKSI HAPUS)
function renderOwnerProperties(data) {
    const grid = document.getElementById('owner-catalog-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    // Jika ID Owner belum diverifikasi pada sesi ini, tampilkan form login internal
    if (!activeOwnerId) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #191B26; border-radius: 8px; border: 1px dashed #232631;">
                <h3 style="color: #66FCF1; margin-bottom: 10px;">🔒 Verifikasi Akses Pemilik</h3>
                <p style="color: #8A8F98; margin-bottom: 20px; font-size: 14px;">Masukkan ID Pemilik / Creator Anda untuk memanajemen properti milik Anda secara aman.</p>
                <div style="display: flex; justify-content: center; gap: 10px; max-width: 400px; margin: 0 auto;">
                    <input type="text" id="owner-login-id" placeholder="Masukkan ID (Contoh: OWNER-01)" style="background: #111; color: #fff; border: 1px solid #232631; padding: 12px; border-radius: 4px; flex: 1; font-size: 14px;">
                    <button class="btn-neon" onclick="loginOwner()" style="padding: 10px 20px; font-size: 12px;">VERIFIKASI</button>
                </div>
            </div>
        `;
        return;
    }

    // Filter data: Ambil properti yang di-upload oleh ID Owner aktif saja
    const myProperties = data.filter(item => item.creator === activeOwnerId);

    if (myProperties.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: #8A8F98;">
                <p>Halo Owner <strong>${activeOwnerId}</strong>, belum ada properti milik Anda yang terdaftar.</p>
                <p style="font-size: 12px; margin-top: 5px;">Silakan upload properti melalui form di atas!</p>
                <button onclick="logoutOwner()" style="background: none; border: none; color: #FF5A5F; cursor: pointer; text-decoration: underline; margin-top: 15px; font-size: 12px;">Ganti / Keluar ID</button>
            </div>
        `;
        return;
    }

    // Baris info Owner aktif
    grid.innerHTML += `
        <div style="grid-column: 1/-1; color: #8A8F98; font-size: 14px; margin-bottom: 10px;">
            Mengelola data sebagai: <strong style="color: #66FCF1;">${activeOwnerId}</strong> | <a href="#" onclick="logoutOwner()" style="color: #FF5A5F; text-decoration: none;">(Keluar / Ganti ID)</a>
        </div>
    `;

    // Render data properti yang cocok
    myProperties.forEach((item) => {
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
        
        grid.innerHTML += `
            <div class="card" style="border: 1px solid #ff5a5f44;">
                <div class="card-img" style="background-image: url('${item.img}')">
                    <span class="badge-right" style="background: #66FCF1; color: #111;">${item.creator}</span>
                </div>
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <p>📍 Kota: ${item.city}<br>💰 Harga: <strong>${formattedPrice}</strong>/malam</p>
                    <button class="btn-neon" onclick="deleteProperty('${item.id}', '${item.title}', '${item.creator}')" style="background: #FF5A5F; color: #fff; border-color: #FF5A5F; margin-top: 10px; width: 100%;">🗑️ HAPUS PROPERTI</button>
                </div>
            </div>
        `;
    });
}

// FUNGSI VERIFIKASI MASUK DASHBOARD
function loginOwner() {
    const inputId = document.getElementById('owner-login-id').value.trim();
    if (inputId === "") {
        alert("ID Owner tidak boleh kosong!");
        return;
    }
    activeOwnerId = inputId;
    
    // Tarik data sekali untuk memperbarui tampilan filter
    database.ref('properties').once('value', (snapshot) => {
        const data = snapshot.val();
        let list = [];
        if(data){
            Object.keys(data).forEach(k => list.push({id:k, ...data[k]}));
        }
        renderOwnerProperties(list);
    });
}

// FUNGSI KELUAR / RESET VERIFIKASI ID OWNER
function logoutOwner() {
    activeOwnerId = "";
    location.reload();
}

// FUNGSI PROTEKSI HAPUS DATA: HANYA OWNER YANG COCOK YANG DAPAT MEMPROSES
function deleteProperty(id, title, creatorId) {
    if (creatorId !== activeOwnerId) {
        alert("⛔ VALIDASI EROR: Anda tidak diizinkan untuk menghapus data akomodasi milik akun lain!");
        return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus secara permanen properti "${title}" dari server STAYVIBE?`)) {
        database.ref(`properties/${id}`).remove()
            .then(() => {
                database.ref(`reviews/${id}`).remove(); // Bersihkan ulasan terkait agar efisien
                alert("Sukses! Properti Anda telah dihapus dari sistem publik.");
            })
            .catch((err) => alert("Gagal memproses penghapusan: " + err.message));
    }
}

// LOGIKA PENCARIAN USER
function searchData() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filterCity = document.getElementById('filter-city').value.toLowerCase().trim();
    const filterType = document.getElementById('filter-type').value;

    const filteredResult = propertyDatabase.filter(item => {
        const matchText = item.title.toLowerCase().includes(searchInput) || item.tags.toLowerCase().includes(searchInput) || item.price.toString().includes(searchInput);
        const matchCity = filterCity === "" || item.city.toLowerCase().includes(filterCity);
        const matchType = filterType === "" || item.regulasi === filterType;
        return matchText && matchCity && matchType;
    });

    renderProperties(filteredResult);
}

// TAMPILKAN PANEL DETAIL PROPERTI JELAS DAN DINAMIS (USER VIEW)
function selectProperty(index) {
    selectedPropertyIndex = index;
    const item = propertyDatabase[index];
    if(!item) return;
    
    document.getElementById('view-title').innerText = item.title;
    document.getElementById('view-desc').innerText = item.desc;
    document.getElementById('view-duration').innerText = `00:00 / ${item.duration}`;
    document.getElementById('view-regulasi').innerText = item.regulasi.toUpperCase();
    document.getElementById('media-preview-text').innerHTML = `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover;">`;

    if(item.maps.includes("http")) {
        document.getElementById('view-maps').innerHTML = `<iframe src="${item.maps}" allowfullscreen="" loading="lazy"></iframe>`;
    } else {
        document.getElementById('view-maps').innerHTML = `📍 Koordinat Lokasi: ${item.maps}`;
    }

    // Pemformatan tautan otomatis nomor WhatsApp petugas
    const phoneNo = item.phone ? item.phone : "#";
    if(phoneNo !== "#") {
        let cleanPhone = phoneNo.replace(/[^0-9]/g, '');
        if(cleanPhone.startsWith('0')) { cleanPhone = '62' + cleanPhone.slice(1); }
        document.getElementById('btn-call').href = `https://wa.me/${cleanPhone}`;
    } else {
        document.getElementById('btn-call').href = "#";
    }
    
    // Pemisahan tautan multi-link OTA secara dinamis menggunakan tanda koma (,)
    const bookingContainer = document.getElementById('booking-links-container');
    bookingContainer.innerHTML = ""; 

    if (item.booking) {
        const linksArray = item.booking.split(',');
        linksArray.forEach((linkUrl) => {
            const cleanUrl = linkUrl.trim();
            if(cleanUrl.includes("http")) {
                let platformName = "BOOKING NOW";
                if(cleanUrl.toLowerCase().includes("traveloka")) platformName = "TRAVELOKA";
                else if(cleanUrl.toLowerCase().includes("reddoorz")) platformName = "REDDOORZ";
                else if(cleanUrl.toLowerCase().includes("pegipegi")) platformName = "PEGIPEGI";
                else if(cleanUrl.toLowerCase().includes("oyorooms") || cleanUrl.toLowerCase().includes("oyo")) platformName = "OYO";
                else if(cleanUrl.toLowerCase().includes("agoda")) platformName = "AGODA";

                bookingContainer.innerHTML += `
                    <a href="${cleanUrl}" target="_blank" class="btn-neon" style="flex: 1; min-width: 120px; text-align: center; background: #FF5A5F; color: #fff; border-color: #FF5A5F; font-size: 11px; padding: 10px;">⚡ ${platformName}</a>
                `;
            }
        });
    } else {
        bookingContainer.innerHTML = `<p style="color: #8A8F98; font-size: 12px;">Tidak ada link booking eksternal.</p>`;
    }
    
    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
    document.getElementById('metadata-specs').innerHTML = `
        <p><strong>1. Title / Nama:</strong> ${item.title}</p>
        <p><strong>2. Creator / Owner ID:</strong> ${item.creator}</p>
        <p><strong>3. City / Lokasi:</strong> ${item.city}</p>
        <p><strong>4. Room Category:</strong> ${item.roomType}</p>
        <p><strong>5. Price Nightly:</strong> ${formattedPrice}</p>
        <p><strong>6. Regulation Mode:</strong> ${item.regulasi}</p>
        <p><strong>7. Facilities Tags:</strong> ${item.tags}</p>
        <p><strong>8. Media Duration:</strong> ${item.duration}</p>
        <p><strong>9. Contact Phone:</strong> ${phoneNo}</p>
    `;
    
    renderReviews(item.id);
}

// TAMPILKAN REVIEWS REAL-TIME (DENGAN DUKUNGAN VISUALISASI FOTO)
function renderReviews(propertyId) {
    const container = document.getElementById('reviews-container');
    if(!container) return;
    
    database.ref(`reviews/${propertyId}`).on('value', (snapshot) => {
        const reviewsData = snapshot.val();
        container.innerHTML = "";
        
        if (!reviewsData) {
            container.innerHTML = `<p style="color: #8A8F98; font-size: 12px;">Belum ada ulasan untuk properti ini.</p>`;
            return;
        }
        
        Object.keys(reviewsData).forEach(key => {
            const rev = reviewsData[key];
            
            // Logika pengecekan lampiran foto ulasan
            let photoHTML = "";
            if(rev.fotoSimulasi && rev.fotoSimulasi !== "No Image") {
                photoHTML = `<p style="margin-top:5px; font-size:11px; color:#66FCF1; font-style:italic;">📸 Lampiran file: ${rev.fotoSimulasi}</p>`;
            }

            container.innerHTML += `
                <div class="review-item">
                    <strong style="color:#66FCF1;">${rev.star}</strong>
                    <p style="margin-top:3px; color:#fff;">"${rev.text}"</p>
                    ${photoHTML}
                </div>
            `;
        });
    });
}

// KIRIM ULASAN BARU DENGAN MEMBACA INPUT FILE FOTO
function submitReview() {
    const starValue = document.getElementById('input-star').value;
    const commentText = document.getElementById('input-comment').value;
    const photoInput = document.getElementById('input-review-photo');
    const currentProperty = propertyDatabase[selectedPropertyIndex];
    
    if (commentText.trim() === "" || !currentProperty) {
        alert("Harap pilih properti dan tulis ulasan teks terlebih dahulu!");
        return;
    }
    
    let stars = "";
    for(let i=0; i<parseInt(starValue); i++) { stars += "⭐"; }
    
    // Deteksi nama file gambar lokal jika diunggah user
    let photoName = (photoInput && photoInput.files.length > 0) ? photoInput.files[0].name : "No Image";
    
    const newReview = { 
        star: stars, 
        text: commentText,
        fotoSimulasi: photoName 
    };
    
    database.ref(`reviews/${currentProperty.id}`).push(newReview)
        .then(() => {
            alert("Ulasan Anda berhasil dikirim secara real-time!");
            document.getElementById('input-comment').value = "";
            if(photoInput) photoInput.value = "";
        })
        .catch((err) => alert("Gagal mengirim ulasan: " + err.message));
}

// HANDLE UPLOAD PROPERTI BARU (DIPERBARUI TOTAL)
function handleUpload(event) {
    event.preventDefault();
    
    // Membaca nama file lokal asli yang kamu masukkan di kolom berkas Pemilik Properti
    const thumbFile = document.getElementById('file-thumb');
    let namaGambarAsli = "";
    
    if (thumbFile && thumbFile.files.length > 0) {
        namaGambarAsli = thumbFile.files[0].name;
    }
    
    // Jika ada file yang dimasukkan, gunakan namanya. Jika kosong, pakai fallback Unsplash
    let finalImgUrl = namaGambarAsli ? namaGambarAsli : "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=500"; 

    const newProperty = {
        title: document.getElementById('meta-title').value,
        creator: document.getElementById('meta-creator').value,
        city: document.getElementById('meta-city').value.trim(),
        roomType: document.getElementById('meta-access').value, 
        price: parseInt(document.getElementById('meta-price').value), 
        regulasi: document.getElementById('meta-regulasi').value, 
        tags: document.getElementById('meta-tags').value,
        duration: document.getElementById('meta-duration').value,
        desc: document.getElementById('meta-desc').value, 
        maps: document.getElementById('meta-maps').value, 
        phone: document.getElementById('meta-phone').value,
        booking: document.getElementById('meta-booking').value,
        img: finalImgUrl, // Menyimpan string nama file gambar aslimu secara dinamis
        statusSistem: "LIVE"
    };

    database.ref('properties').push(newProperty)
        .then(() => {
            alert(`SUKSES: Properti "${newProperty.title}" berhasil di-upload ke sistem dan live di internet!`);
            document.getElementById('upload-form').reset();
        })
        .catch((error) => alert("Gagal koneksi server: " + error.message));
}