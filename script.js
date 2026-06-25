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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let propertyDatabase = [];
let selectedPropertyIndex = -1;

const isOwnerPage = window.location.pathname.includes("dashboard-owner.html");
let activeOwnerId = ""; 

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
        
        if (isOwnerPage) {
            renderOwnerProperties(propertyDatabase);
        } else {
            renderProperties(propertyDatabase);
        }
    } else {
        const emptyMsg = `<p style="color: #8A8F98; grid-column: 1/-1; text-align: center; padding: 40px;">Database kosong.</p>`;
        if (isOwnerPage) {
            renderOwnerProperties([]); 
        } else {
            const grid = document.getElementById('catalog-grid');
            if(grid) grid.innerHTML = emptyMsg;
        }
    }
});

// RENDER CARD USER - CARD BISA DIKLIK LANGSUNG UNTUK POP-UP
function renderProperties(data) {
    const grid = document.getElementById('catalog-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    data.forEach((item, index) => {
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
        const syariahClass = item.regulasi === "Syariah" ? "badge-syariah" : "";

        // Menambahkan properti cursor:pointer dan onclick langsung pada seluruh permukaan card
        grid.innerHTML += `
            <div class="card" onclick="selectProperty(${index})" style="cursor: pointer;">
                <div class="card-img" style="background-image: url('${item.img}')">
                    <span class="badge-right ${syariahClass}">${item.regulasi} - ${item.roomType}</span>
                </div>
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <p>📍 Kota: ${item.city}<br>💰 Harga: <strong>${formattedPrice}</strong>/malam<br>🏷️ ${item.tags}</p>
                    <button class="btn-neon" style="width: 100%; margin-top: 10px;">Lihat Detail & Ulasan</button>
                </div>
            </div>
        `;
    });
}

// BUKA MODAL DETAIL PROPERTI
function selectProperty(index) {
    selectedPropertyIndex = index;
    const item = propertyDatabase[index];
    if(!item) return;
    
    const modal = document.getElementById('property-modal');
    if(modal) modal.style.display = "block";
    
    document.getElementById('view-title').innerText = item.title;
    document.getElementById('view-desc').innerText = item.desc;
    document.getElementById('media-preview-text').innerHTML = `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover;">`;

    if(item.maps && item.maps.includes("http")) {
        document.getElementById('view-maps').innerHTML = `<iframe src="${item.maps}" style="width:100%; height:100%; border:0;" allowfullscreen="" loading="lazy"></iframe>`;
    } else {
        document.getElementById('view-maps').innerHTML = `<div style="padding: 20px; color: #8A8F98;">📍 Koordinat Lokasi: ${item.maps || 'Tidak ada data'}</div>`;
    }

    const phoneNo = item.phone ? item.phone : "#";
    if(phoneNo !== "#") {
        let cleanPhone = phoneNo.replace(/[^0-9]/g, '');
        if(cleanPhone.startsWith('0')) { cleanPhone = '62' + cleanPhone.slice(1); }
        document.getElementById('btn-call').href = `https://wa.me/${cleanPhone}`;
    } else {
        document.getElementById('btn-call').href = "#";
    }
    
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
                else if(cleanUrl.toLowerCase().includes("agoda")) platformName = "AGODA";

                bookingContainer.innerHTML += `
                    <a href="${cleanUrl}" target="_blank" class="btn-neon" style="flex: 1; text-align: center; background: #FF5A5F; color: #fff; border-color: #FF5A5F; font-size: 11px; padding: 10px; text-decoration: none; font-weight: bold; border-radius: 4px;">⚡ ${platformName}</a>
                `;
            }
        });
    } else {
        bookingContainer.innerHTML = `<p style="color: #8A8F98; font-size: 12px; padding-top: 10px;">No Booking Link</p>`;
    }
    
    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
    document.getElementById('metadata-specs').innerHTML = `
        <p><strong>Owner ID:</strong> ${item.creator}</p>
        <p><strong>Kota Lokasi:</strong> ${item.city}</p>
        <p><strong>Kategori Kamar:</strong> ${item.roomType}</p>
        <p><strong>Harga Sewa:</strong> ${formattedPrice}/malam</p>
        <p><strong>Regulasi Konten:</strong> ${item.regulasi}</p>
        <p><strong>Fasilitas:</strong> ${item.tags}</p>
    `;
    
    renderReviews(item.id);
}

// TUTUP MODAL DETAL
function closeModal() {
    const modal = document.getElementById('property-modal');
    if(modal) modal.style.display = "none";
}

// TUTUP MODAL JIKA KLIK DI LUAR BOX AREA
window.onclick = function(event) {
    const modal = document.getElementById('property-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// SIMPAN DATA KE REAL-TIME DATABASE
function handleUpload(event) {
    event.preventDefault();
    
    // Membaca teks tautan URL dari input yang sudah kita perbarui di HTML Owner
    const imgUrlInput = document.getElementById('file-thumb').value.trim();
    let finalImg = imgUrlInput ? imgUrlInput : "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=500";

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
        img: finalImg,
        statusSistem: "LIVE"
    };

    database.ref('properties').push(newProperty)
        .then(() => {
            alert(`SUKSES: Properti "${newProperty.title}" berhasil di-upload ke sistem dan live di internet!`);
            document.getElementById('upload-form').reset();
        })
        .catch((error) => alert("Gagal koneksi server: " + error.message));
}

// RENDERING UNTUK DASHBOARD OWNER
function renderOwnerProperties(data) {
    const grid = document.getElementById('owner-catalog-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    if (!activeOwnerId) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #191B26; border-radius: 8px; border: 1px dashed #232631;">
                <h3 style="color: #66FCF1; margin-bottom: 10px;">🔒 Verifikasi Akses Pemilik</h3>
                <div style="display: flex; justify-content: center; gap: 10px; max-width: 400px; margin: 0 auto;">
                    <input type="text" id="owner-login-id" placeholder="Masukkan ID (Contoh: OWNER-01)" style="background: #111; color: #fff; border: 1px solid #232631; padding: 12px; border-radius: 4px; flex: 1; font-size: 14px;">
                    <button class="btn-neon" onclick="loginOwner()">VERIFIKASI</button>
                </div>
            </div>
        `;
        return;
    }

    const myProperties = data.filter(item => item.creator === activeOwnerId);
    if (myProperties.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; color:#8A8F98; text-align:center;">Belum ada properti terdaftar untuk ID ini.</p>`;
        return;
    }

    myProperties.forEach((item) => {
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price);
        grid.innerHTML += `
            <div class="card" style="border: 1px solid #ff5a5f44;">
                <div class="card-img" style="background-image: url('${item.img}')"></div>
                <div class="card-body">
                    <h3>${item.title}</h3>
                    <p>💰 Harga: <strong>${formattedPrice}</strong>/malam</p>
                    <button class="btn-neon" onclick="deleteProperty('${item.id}', '${item.title}', '${item.creator}')" style="background: #FF5A5F; color: #fff; border-color: #FF5A5F; margin-top: 10px; width: 100%;">🗑️ HAPUS PROPERTI</button>
                </div>
            </div>
        `;
    });
}

function loginOwner() {
    const inputId = document.getElementById('owner-login-id').value.trim();
    if (inputId === "") return alert("ID Owner kosong!");
    activeOwnerId = inputId;
    location.reload();
}

function deleteProperty(id, title, creatorId) {
    if (confirm(`Hapus permanen properti "${title}"?`)) {
        database.ref(`properties/${id}`).remove().then(() => alert("Sukses dihapus."));
    }
}

function renderReviews(propertyId) {
    const container = document.getElementById('reviews-container');
    if(!container) return;
    
    database.ref(`reviews/${propertyId}`).on('value', (snapshot) => {
        const reviewsData = snapshot.val();
        container.innerHTML = "";
        if (!reviewsData) {
            container.innerHTML = `<p style="color: #8A8F98; font-size: 12px;">Belum ada ulasan.</p>`;
            return;
        }
        Object.keys(reviewsData).forEach(key => {
            const rev = reviewsData[key];
            container.innerHTML += `<div style="border-bottom:1px solid #232631; padding: 5px 0;"><strong style="color:#66FCF1;">${rev.star}</strong>: ${rev.text}</div>`;
        });
    });
}

function submitReview() {
    const starValue = document.getElementById('input-star').value;
    const commentText = document.getElementById('input-comment').value;
    const currentProperty = propertyDatabase[selectedPropertyIndex];
    
    if (commentText.trim() === "" || !currentProperty) return alert("Tulis komentar terlebih dahulu!");
    
    let stars = "⭐".repeat(parseInt(starValue));
    const newReview = { star: stars, text: commentText };
    
    database.ref(`reviews/${currentProperty.id}`).push(newReview)
        .then(() => {
            document.getElementById('input-comment').value = "";
        });
}