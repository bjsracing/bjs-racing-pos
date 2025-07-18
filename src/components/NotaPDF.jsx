// src/components/NotaPDF.jsx

import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { bankTransferInfo } from "../config/paymentInfo.js";

// Daftarkan font (opsional, tapi membuat tampilan lebih baik)
// Font.register({ family: 'Helvetica', fonts: [...] });

// Buat styles untuk dokumen PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1E293B",
  },
  header: {
    textAlign: "center",
    borderBottom: 2,
    borderColor: "black",
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  headerSubtitle: { fontSize: 12, fontWeight: "bold" },
  section: { marginTop: 20 },
  docTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textDecoration: "underline",
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colHalf: { width: "50%" },
  colThird: { width: "33%" },
  textBold: { fontWeight: "bold" },
  table: { display: "table", width: "auto", marginTop: 20 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#CBD5E1" },
  tableColHeader: {
    width: "15%",
    backgroundColor: "#F1F5F9",
    padding: 5,
    fontWeight: "bold",
  },
  tableCol: { width: "15%", padding: 5 },
  tableColNo: { width: "5%", padding: 5, textAlign: "center" },
  tableColItem: { width: "40%", padding: 5 },
  textRight: { textAlign: "right" },
  totals: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsTable: { width: "50%" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 2,
    paddingTop: 10,
    textAlign: "center",
    fontSize: 8,
  },
  signatureSection: {
    marginTop: 40,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  signatureBox: {
    marginTop: 40,
    borderTop: 1,
    paddingTop: 5,
    width: 150,
    textAlign: "center",
  },
});

const NotaPDF = ({ data, title, showSignatureBlocks = false }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BJS RACING</Text>
        <Text style={styles.headerSubtitle}>DISTRIBUTOR SPRAY PAINT/PILOK</Text>
        <Text>
          Alamat: Jl. Wijaya Kusuma, Bangsri, Jepara (Samping SMP N 1 Bangsri)
        </Text>
        <Text>Telp/WA: 0881 01166 9213</Text>
      </View>

      {/* INFO DOKUMEN */}
      <View style={styles.section}>
        <Text style={styles.docTitle}>{title}</Text>
        <View style={styles.flexRow}>
          <View style={styles.colHalf}>
            <Text style={styles.textBold}>Kepada Yth:</Text>
            <Text style={{ ...styles.textBold, fontSize: 12 }}>
              {data.customer.nama_pelanggan}
            </Text>
            <Text>{data.customer.alamat || "Alamat tidak tersedia"}</Text>
            <Text>Telp: {data.customer.telepon || "-"}</Text>
          </View>
          <View style={{ ...styles.colThird, textAlign: "right" }}>
            <Text>
              <Text style={styles.textBold}>No:</Text>{" "}
              {data.invoice_number || data.so_number}
            </Text>
            <Text>
              <Text style={styles.textBold}>Tanggal:</Text>{" "}
              {new Date(
                data.tanggal_nota || data.tanggal_pesanan,
              ).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      </View>

      {/* TABEL ITEM */}
      <View style={styles.table}>
        {/* Header Tabel */}
        <View style={{ ...styles.tableRow, backgroundColor: "#F1F5F9" }}>
          <View style={{ ...styles.tableColHeader, ...styles.tableColNo }}>
            <Text>NO</Text>
          </View>
          <View style={{ ...styles.tableColHeader, width: "15%" }}>
            <Text>KODE</Text>
          </View>
          <View style={{ ...styles.tableColHeader, ...styles.tableColItem }}>
            <Text>NAMA BARANG</Text>
          </View>
          <View
            style={{
              ...styles.tableColHeader,
              width: "10%",
              textAlign: "center",
            }}
          >
            <Text>QTY</Text>
          </View>
          <View style={{ ...styles.tableColHeader, textAlign: "right" }}>
            <Text>HARGA</Text>
          </View>
          <View style={{ ...styles.tableColHeader, textAlign: "right" }}>
            <Text>JUMLAH</Text>
          </View>
        </View>
        {/* Isi Tabel */}
        {data.items.map((item, index) => (
          <View style={styles.tableRow} key={item.id}>
            <View style={{ ...styles.tableCol, ...styles.tableColNo }}>
              <Text>{index + 1}</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "15%" }}>
              <Text>{item.products.kode}</Text>
            </View>
            <View style={{ ...styles.tableCol, ...styles.tableColItem }}>
              <Text>{item.products.nama}</Text>
            </View>
            <View
              style={{ ...styles.tableCol, width: "10%", textAlign: "center" }}
            >
              <Text>{item.kuantitas}</Text>
            </View>
            <View style={{ ...styles.tableCol, ...styles.textRight }}>
              <Text>
                {new Intl.NumberFormat("id-ID").format(item.harga_grosir_deal)}
              </Text>
            </View>
            <View style={{ ...styles.tableCol, ...styles.textRight }}>
              <Text>
                {new Intl.NumberFormat("id-ID").format(
                  item.harga_grosir_deal * item.kuantitas,
                )}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* TOTALS */}
      <View style={styles.totals}>
        <View style={styles.totalsTable}>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCol, width: "50%" }}>SUBTOTAL</Text>
            <Text
              style={{ ...styles.tableCol, ...styles.textRight, width: "50%" }}
            >
              {new Intl.NumberFormat("id-ID").format(data.subtotal)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCol, width: "50%" }}>DISKON</Text>
            <Text
              style={{ ...styles.tableCol, ...styles.textRight, width: "50%" }}
            >
              {new Intl.NumberFormat("id-ID").format(data.total_diskon)}
            </Text>
          </View>
          <View style={{ ...styles.tableRow, backgroundColor: "#F1F5F9" }}>
            <Text
              style={{ ...styles.tableCol, ...styles.textBold, width: "50%" }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                ...styles.tableCol,
                ...styles.textRight,
                ...styles.textBold,
                width: "50%",
              }}
            >
              {new Intl.NumberFormat("id-ID").format(data.total_akhir)}
            </Text>
          </View>
        </View>
      </View>

      {/* INFO PEMBAYARAN & TANDA TANGAN */}
      <View
        style={{
          ...styles.section,
          ...styles.flexRow,
          alignItems: "flex-start",
        }}
      >
        <View>
          <Text style={{ ...styles.textBold, textDecoration: "underline" }}>
            Info Pembayaran Transfer:
          </Text>
          <Text>
            Bank: <Text style={styles.textBold}>{bankTransferInfo.bank}</Text>
          </Text>
          <Text>
            No. Rekening:{" "}
            <Text style={styles.textBold}>{bankTransferInfo.account}</Text>
          </Text>
          <Text>
            Atas Nama:{" "}
            <Text style={styles.textBold}>{bankTransferInfo.atas_nama}</Text>
          </Text>
        </View>

        {showSignatureBlocks && (
          <View style={styles.signatureSection}>
            <View style={{ textAlign: "center", marginRight: 40 }}>
              <Text>Hormat Kami,</Text>
              <View style={{ height: 50 }}></View>
              <Text>(__________________)</Text>
            </View>
            <View style={{ textAlign: "center" }}>
              <Text>Penerima Barang,</Text>
              <View style={{ height: 50 }}></View>
              <Text>(__________________)</Text>
            </View>
          </View>
        )}
      </View>

      {/* FOOTER */}
      <Text style={styles.footer}>
        Belanja Gak Pake Drama, Disini Tempatnya!
      </Text>
    </Page>
  </Document>
);

export default NotaPDF;
