const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input"); 
const fs = require("fs");

// --- KONFIGURASI ---
const apiId = wajib isi;
const apiHash = "wajib isi";
const SESSION_FILE = "session_string.txt"; 

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    console.log("Memulai System Userbot Fast Broadcast...");

    let stringSession = new StringSession("");
    if (fs.existsSync(SESSION_FILE)) {
        stringSession = new StringSession(fs.readFileSync(SESSION_FILE, "utf-8"));
    }

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Masukkan Nomor HP: "),
        password: async () => await input.text("Password 2FA: "),
        phoneCode: async () => await input.text("OTP: "),
        onError: (err) => console.log(err),
    });

    console.log("✅ Berhasil Login!");
    fs.writeFileSync(SESSION_FILE, client.session.save());

    const me = await client.getMe();

    client.addEventHandler(async (event) => {
        try {
            const message = event.message;
            if (!message || !message.text) return;

            const text = message.text;
            const myId = me.id.toString();
            const senderId = message.senderId ? message.senderId.toString() : null;

            if ((text.startsWith("/bcgc") || text.startsWith("/broadcast")) && senderId === myId) {
                
                const broadcastMsg = text.split(" ").slice(1).join(" ");
                if (!broadcastMsg) {
                    await client.sendMessage(me.id, { message: "❌ Masukkan pesan! Contoh: /bcgc Tes" });
                    return;
                }

                await message.reply({ message: "🚀 **Memulai FAST Broadcast (1 detik/grup) selama 1 jam!**" });

                const startTime = Date.now();
                const ONE_HOUR = 60 * 60 * 1000; // 1 jam dalam milidetik
                let totalSent = 0;
                let loopCount = 1;

                // LOOPING UTAMA (Selama belum 1 jam)
                while (Date.now() - startTime < ONE_HOUR) {
                    console.log(`--- Memulai Putaran ke-${loopCount} ---`);
                    
                    const dialogs = await client.getDialogs();
                    const groups = dialogs.filter(d => d.isGroup);

                    for (const group of groups) {
                        // Cek lagi durasi di dalam loop kecil agar bisa langsung berhenti jika lewat 1 jam
                        if (Date.now() - startTime > ONE_HOUR) break;

                        try {
                            await client.sendMessage(group.id, { message: broadcastMsg });
                            totalSent++;
                            console.log(`[${loopCount}] Terkirim ke: ${group.title}`);
                        } catch (e) {
                            console.log(`Gagal di ${group.title}: ${e.message}`);
                            if (e.message.includes("FLOOD")) {
                                console.log("Kena Limit! Istirahat 30 detik...");
                                await sleep(30000);
                            }
                        }
                        // JEDA 1 DETIK
                        await sleep(1000);
                    }
                    
                    loopCount++;
                    await sleep(2000); // Jeda sebentar sebelum mengulang putaran grup
                }

                await client.sendMessage(me.id, { 
                    message: `🏁 **Broadcast 1 Jam Selesai!**\nTotal pesan terkirim: ${totalSent}\nTotal putaran: ${loopCount-1}` 
                });
            }
        } catch (err) {
            console.error("Error:", err);
        }
    }, new NewMessage({ incoming: true, outgoing: true }));

})();