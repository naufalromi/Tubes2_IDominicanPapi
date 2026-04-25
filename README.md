# DOM Tree Traversal - BFS dan DFS

Aplikasi ini adalah aplikasi web untuk melakukan pencarian elemen pada DOM Tree HTML menggunakan algoritma **Breadth-First Search (BFS)** dan **Depth-First Search (DFS)**. Pengguna dapat memasukkan sumber HTML, memilih CSS selector, memilih algoritma traversal, lalu mendapatkan hasil pencarian beserta statistik, traversal path, DOM tree, dan traversal log.

## Penjelasan Singkat Algoritma

### Breadth-First Search (BFS)

BFS adalah algoritma traversal yang menelusuri tree secara melebar. Pada implementasi program ini, BFS dimulai dari root DOM, lalu mengunjungi node berdasarkan level kedalaman. Node pada level yang sama akan diproses terlebih dahulu sebelum masuk ke level berikutnya.

Implementasi BFS menggunakan struktur **queue** berisi state pencarian. Setiap state menyimpan node yang sedang dikunjungi, indeks bagian selector yang sedang dicocokkan, depth, dan combinator yang sedang digunakan. Program mencatat node yang sudah dikunjungi agar tidak diproses berulang. Jika node cocok dengan bagian selector terakhir, node tersebut dimasukkan ke daftar hasil pencarian.

BFS pada program ini juga mendukung beberapa combinator selector, yaitu:

- ` ` atau descendant combinator, untuk mencari turunan pada kedalaman mana pun.
- `>` atau child combinator, untuk mencari anak langsung.
- `+` atau adjacent sibling combinator, untuk mencari sibling elemen berikutnya.
- `~` atau general sibling combinator, untuk mencari semua sibling setelah elemen tersebut.

### Depth-First Search (DFS)

DFS adalah algoritma traversal yang menelusuri tree secara mendalam. Pada implementasi program ini, DFS dimulai dari root DOM, lalu masuk ke child node terlebih dahulu sebelum berpindah ke sibling berikutnya.

Implementasi DFS menggunakan fungsi rekursif `searchDFSRecursive`. Setiap pemanggilan rekursif membawa state pencarian yang berisi node saat ini, indeks selector yang sedang dicocokkan, depth, dan combinator. Program juga menggunakan `visited` untuk mencegah state yang sama diproses berulang.

Jika node yang sedang diproses cocok dengan bagian selector yang sedang dicari, DFS akan melanjutkan pencarian sesuai combinator selector berikutnya. Jika node cocok dengan bagian selector terakhir, node tersebut dimasukkan ke hasil pencarian. Traversal log dan hasil DFS kemudian diurutkan berdasarkan urutan node agar output lebih konsisten.

## Requirement Program

Untuk menjalankan program, diperlukan salah satu dari requirement berikut sesuai cara menjalankannya:

- **Docker** harus tersedia, minimal jika ingin menjalankan aplikasi secara langsung menggunakan Docker.
- **Go Language** harus tersedia jika ingin menjalankan backend saja.
- **npm** harus tersedia jika ingin menjalankan frontend saja.

## Cara Menjalankan Program

### Menjalankan dengan Docker

Masuk ke folder `src`, lalu jalankan:

```bash
docker compose up --build
```

Setelah container berjalan, buka aplikasi melalui browser sesuai port yang digunakan oleh konfigurasi Docker.

Umumnya aplikasi dapat diakses melalui: 

```text
http://localhost:8080
```

### Menjalankan Backend Saja

Masuk ke folder backend:

```bash
cd src/backend
```

Jalankan backend dengan command:

```bash
go run .
```

Backend akan berjalan pada:

```text
http://localhost:8080
```

Endpoint utama backend:

```text
POST /api/search
```

### Menjalankan Frontend Saja

Masuk ke folder frontend:

```bash
cd src/frontend
```

Install dependency:

```bash
npm install
```

Jalankan frontend:

```bash
npm run dev
```

Frontend akan berjalan pada alamat localhost sesuai output dari npm, biasanya:

```text
http://localhost:5173
```

atau sesuai konfigurasi project.

## Build / Compile Program

### Build dengan Docker

```bash
cd src
docker compose up --build
```

### Build / Run Backend Go

```bash
cd src/backend
go run .
```

### Build / Run Frontend

```bash
cd src/frontend
npm install
npm run dev
```

## Author

- **Nama:** Audric Yusuf Maynard Simatupang
- **NIM:** 13524010
- **Nama:** Muhammad Naufal Romi Annafi
- **NIM:** 13524058
- **Nama:** Nathan Edward Christofer Marpaung
- **NIM:** 13524062