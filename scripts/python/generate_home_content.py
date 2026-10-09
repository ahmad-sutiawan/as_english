#!/usr/bin/env python3
"""Write the home-life content bank: modules, speak packs, and build drills."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOME = ROOT / "content" / "home"

SVO = ("Subject + Verb + Object", "Subjek + Kata kerja + Objek")
BECAUSE = (
    "Subject + Verb + Object + because + clause",
    "Subjek + Kata kerja + Objek + because + klausa",
)
FUTURE = ("Subject + will + Verb + Object", "Subjek + will + Kata kerja + Objek")
QUESTION = (
    "Yes/No question: Auxiliary + Subject + Verb (+ Object)",
    "Pertanyaan Ya/Tidak: Auxiliary + Subjek + Kata kerja (+ Objek)",
)
WH = (
    "Wh-question: Wh-word + Auxiliary + Subject + Verb (+ Object)",
    "Pertanyaan Wh: Wh-word + Auxiliary + Subjek + Kata kerja (+ Objek)",
)
MULTI = (
    "Multi-clause: Subject + Verb + Object + connector + clause",
    "Multi-klausa: Subjek + Kata kerja + Objek + konektor + klausa",
)


def choice(key: str, text: str, text_id: str, structure=SVO) -> dict:
    pattern, pattern_id = structure
    return {
        "key": key,
        "text": text,
        "textId": text_id,
        "structure": pattern,
        "structureId": pattern_id,
    }


def mcq_item(
    module_id: str,
    index: int,
    scenario: str,
    scenario_id: str,
    prompt: str,
    prompt_id: str,
    correct: str,
    correct_id: str,
    near: str,
    near_id: str,
    tag: str,
    structure=SVO,
) -> dict:
    difficulty = ("junior", "mid", "senior")[index % 3]
    vague = "I'm not sure what to say."
    vague_id = "Saya tidak yakin harus berkata apa."
    dodge = "Someone else can deal with it later."
    dodge_id = "Orang lain bisa mengurusnya nanti."
    return {
        "id": f"{module_id}-{index:02d}",
        "moduleId": module_id,
        "difficulty": difficulty,
        "scenario": scenario,
        "scenarioId": scenario_id,
        "scenarioStructure": structure[0],
        "scenarioStructureId": structure[1],
        "prompt": prompt,
        "promptId": prompt_id,
        "promptStructure": WH[0],
        "promptStructureId": WH[1],
        "choices": [
            choice("A", near, near_id, structure),
            choice("B", correct, correct_id, structure),
            choice("C", vague, vague_id),
            choice("D", dodge, dodge_id, FUTURE),
        ],
        "correctKey": "B",
        "explanation": (
            f"Jawaban yang utuh untuk situasi ini: \"{correct}\" ({correct_id}). "
            "Pilihan lain terlalu pendek, menghindar, atau tidak menjawab permintaan."
        ),
        "tags": [tag, "rumah"],
    }


def module_from_rows(meta: dict, rows: list[tuple], structure=SVO) -> dict:
    prompt, prompt_id = meta["prompt"]
    items = [
        mcq_item(
            meta["id"],
            i,
            scenario,
            scenario_id,
            prompt,
            prompt_id,
            correct,
            correct_id,
            near,
            near_id,
            meta["tag"],
            structure,
        )
        for i, (scenario, scenario_id, correct, correct_id, near, near_id) in enumerate(rows, 1)
    ]
    return {
        "id": meta["id"],
        "title": meta["title"],
        "titleId": meta["titleId"],
        "description": meta["description"],
        "persona": ["Rumah"],
        "status": "ready",
        "itemCount": len(items),
        "items": items,
    }


def you_turn(turn_id: str, role: str, role_id: str, correct: str, correct_id: str, near: str, near_id: str) -> dict:
    return {
        "id": turn_id,
        "speaker": "you",
        "roleLabel": role,
        "roleLabelId": role_id,
        "text": correct,
        "textId": correct_id,
        "structure": MULTI[0],
        "structureId": MULTI[1],
        "correctKey": "B",
        "choices": [
            choice("A", near, near_id, MULTI),
            choice("B", correct, correct_id, MULTI),
            choice("C", "I don't know.", "Saya tidak tahu."),
            choice("D", "Can you just decide?", "Kamu saja yang putuskan?", QUESTION),
        ],
    }


def them_turn(turn_id: str, role: str, role_id: str, text: str, text_id: str) -> dict:
    return {
        "id": turn_id,
        "speaker": "them",
        "roleLabel": role,
        "roleLabelId": role_id,
        "text": text,
        "textId": text_id,
        "structure": WH[0],
        "structureId": WH[1],
    }


def dialogue_item(index: int, scenario: str, scenario_id: str, turns: list[dict], tag: str) -> dict:
    you = next(turn for turn in turns if turn["speaker"] == "you")
    return {
        "id": f"home-live-dialogue-{index:02d}",
        "moduleId": "home-live-dialogue",
        "difficulty": "mid",
        "kind": "dialogue",
        "scenario": scenario,
        "scenarioId": scenario_id,
        "scenarioStructure": MULTI[0],
        "scenarioStructureId": MULTI[1],
        "prompt": "Complete your turns in this home conversation.",
        "promptId": "Lengkapi giliranmu dalam percakapan rumah ini.",
        "promptStructure": "Task prompt: Imperative / instruction + Object",
        "promptStructureId": "Prompt tugas: Imperatif / instruksi + Objek",
        "choices": you["choices"],
        "correctKey": "B",
        "explanation": "Tiap giliranmu menjawab pertanyaan lawan bicara dengan fakta, langkah, dan waktu. Hindari jawaban samar.",
        "tags": [tag, "rumah", "dialogue"],
        "turns": turns,
    }


MODULES = [
    {
        "meta": {
            "id": "home-family-stories",
            "title": "Family Stories",
            "titleId": "Cerita Keluarga",
            "description": "Menceritakan kejadian di rumah dengan urutan yang jelas: apa yang terjadi, mengapa, dan apa yang kamu lakukan.",
            "prompt": ("How do you tell the story?", "Bagaimana kamu menceritakannya?"),
            "tag": "cerita",
        },
        "rows": [
            ("Your sister asks why dinner was late.", "Adikmu bertanya mengapa makan malam terlambat.", "Dinner was late because I had to pick up Dad from the clinic.", "Makan malam terlambat karena saya harus menjemput Ayah dari klinik.", "Dinner was late.", "Makan malam terlambat."),
            ("Your child wants to know why the lights went out.", "Anakmu ingin tahu mengapa lampu mati.", "The lights went out because the storm knocked a branch onto the line.", "Lampu mati karena badai menjatuhkan dahan ke kabel.", "The lights went out.", "Lampu mati."),
            ("Your partner asks about the broken glass.", "Pasanganmu bertanya soal pecahan gelas.", "The glass broke because the cat jumped onto the table.", "Gelas pecah karena kucing melompat ke meja.", "The glass broke.", "Gelas pecah."),
            ("A neighbor asks about the noise last night.", "Tetangga bertanya soal suara semalam.", "The noise was the washing machine, and I turned it off at ten.", "Suaranya mesin cuci, dan saya mematikannya pukul sepuluh.", "It was noisy.", "Berisik."),
            ("Your mother asks why you came home early.", "Ibu bertanya mengapa kamu pulang lebih awal.", "I came home early because my son had a fever.", "Saya pulang lebih awal karena anak saya demam.", "I came home early.", "Saya pulang lebih awal."),
            ("Your father asks how the garden looks better.", "Ayah bertanya mengapa kebun terlihat lebih baik.", "I watered the plants and cut the dry leaves this morning.", "Saya menyiram tanaman dan memotong daun kering pagi ini.", "The garden looks better.", "Kebun terlihat lebih baik."),
            ("Your aunt asks about the family lunch.", "Bibi bertanya soal makan siang keluarga.", "We ate together, and my brother brought the fruit.", "Kami makan bersama, dan kakak saya membawa buah.", "We had lunch.", "Kami makan siang."),
            ("Your child asks why the cake is small.", "Anakmu bertanya mengapa kuenya kecil.", "The cake is small because I only had two eggs left.", "Kuenya kecil karena telur saya tinggal dua.", "The cake is small.", "Kuenya kecil."),
            ("Your partner asks about the wet floor.", "Pasanganmu bertanya soal lantai basah.", "The floor is wet because the window was open in the rain.", "Lantai basah karena jendela terbuka saat hujan.", "The floor is wet.", "Lantai basah."),
            ("Your cousin asks why you missed the gathering.", "Sepupumu bertanya mengapa kamu absen kumpul keluarga.", "I missed it because I was taking Grandma to the doctor.", "Saya tidak datang karena mengantar Nenek ke dokter.", "I missed it.", "Saya tidak datang."),
            ("Your son asks why his shirt is still dirty.", "Anakmu bertanya mengapa bajunya masih kotor.", "The shirt is still dirty because the soap ran out mid-wash.", "Bajunya masih kotor karena sabun habis di tengah cuci.", "The shirt is dirty.", "Bajunya kotor."),
            ("Your partner asks how the leak started.", "Pasanganmu bertanya bagaimana bocor itu mulai.", "The leak started when the hose split behind the washing machine.", "Bocor mulai saat selang di belakang mesin cuci pecah.", "There was a leak.", "Ada kebocoran."),
            ("Your neighbor asks about the new plants.", "Tetangga bertanya soal tanaman baru.", "I planted chili and tomato because the children wanted a garden.", "Saya menanam cabai dan tomat karena anak-anak ingin kebun.", "There are new plants.", "Ada tanaman baru."),
            ("Your mother asks why the fridge is full.", "Ibu bertanya mengapa kulkas penuh.", "The fridge is full because the market had a good price on vegetables.", "Kulkas penuh karena harga sayur di pasar sedang baik.", "The fridge is full.", "Kulkas penuh."),
            ("Your child asks about the scratched table.", "Anakmu bertanya soal meja yang tergores.", "The table is scratched because we moved it without a cloth underneath.", "Meja tergores karena kami memindahkannya tanpa kain di bawah.", "The table is scratched.", "Meja tergores."),
            ("Your partner asks why you look tired.", "Pasanganmu bertanya mengapa kamu terlihat lelah.", "I look tired because the baby woke up three times.", "Saya terlihat lelah karena bayi terbangun tiga kali.", "I look tired.", "Saya terlihat lelah."),
            ("Your brother asks how you fixed the fan.", "Kakakmu bertanya bagaimana kamu memperbaiki kipas.", "I cleaned the dust and tightened the loose screw.", "Saya membersihkan debu dan mengencangkan sekrup yang longgar.", "I fixed the fan.", "Saya memperbaiki kipas."),
            ("Your child asks why school starts early tomorrow.", "Anakmu bertanya mengapa sekolah mulai lebih pagi besok.", "School starts early because the class is visiting the museum.", "Sekolah mulai lebih pagi karena kelas berkunjung ke museum.", "School starts early.", "Sekolah mulai lebih pagi."),
        ],
    },
    {
        "meta": {
            "id": "home-how-things-work",
            "title": "How Things Work",
            "titleId": "Cara Kerja di Rumah",
            "description": "Menjelaskan langkah memakai alat rumah, resep singkat, dan cara sesuatu bekerja.",
            "prompt": ("How do you explain it?", "Bagaimana kamu menjelaskannya?"),
            "tag": "cara-kerja",
        },
        "rows": [
            ("Your child asks how the rice cooker works.", "Anakmu bertanya bagaimana rice cooker bekerja.", "You add rice and water, close the lid, and press cook.", "Kamu masukkan beras dan air, tutup penutupnya, lalu tekan cook.", "It cooks rice.", "Itu memasak nasi."),
            ("Your partner asks how to use the new washer.", "Pasanganmu bertanya cara memakai mesin cuci baru.", "Put the clothes in, add detergent, choose the cycle, and press start.", "Masukkan baju, tambahkan detergen, pilih siklus, lalu tekan mulai.", "Press start.", "Tekan mulai."),
            ("Your father asks how the water filter works.", "Ayah bertanya bagaimana filter air bekerja.", "Water passes through the filter, and clean water comes out the tap.", "Air melewati filter, dan air bersih keluar dari keran.", "It cleans water.", "Itu membersihkan air."),
            ("Your child asks how to boil an egg.", "Anakmu bertanya cara merebus telur.", "Put the egg in cold water, boil it for eight minutes, then cool it.", "Masukkan telur ke air dingin, rebus delapan menit, lalu dinginkan.", "Boil the egg.", "Rebus telurnya."),
            ("Your partner asks how the thermostat works.", "Pasanganmu bertanya cara kerja termostat.", "You set the temperature, and the unit turns on when the room is warmer.", "Kamu atur suhunya, dan unit menyala saat ruangan lebih hangat.", "It controls the room.", "Itu mengatur ruangan."),
            ("Your mother asks how to lock the front gate.", "Ibu bertanya cara mengunci pagar depan.", "Close the gate, turn the key to the left, and check that it does not move.", "Tutup pagar, putar kunci ke kiri, dan pastikan pagar tidak bergerak.", "Use the key.", "Pakai kuncinya."),
            ("Your child asks how the blender works.", "Anakmu bertanya cara kerja blender.", "Add the fruit, close the lid, and press the button for ten seconds.", "Masukkan buah, tutup penutupnya, dan tekan tombol selama sepuluh detik.", "Press the button.", "Tekan tombolnya."),
            ("Your partner asks how the Wi-Fi extender works.", "Pasanganmu bertanya cara kerja penguat Wi-Fi.", "Plug it in near the router, wait for the light, then place it closer to the bedrooms.", "Colokkan di dekat router, tunggu lampunya, lalu letakkan lebih dekat ke kamar.", "It makes Wi-Fi stronger.", "Itu membuat Wi-Fi lebih kuat."),
            ("Your son asks how to change a light bulb.", "Anakmu bertanya cara mengganti bohlam.", "Turn off the switch, let the bulb cool, twist it out, and twist the new one in.", "Matikan sakelar, biarkan bohlam dingin, putar keluar, lalu putar yang baru masuk.", "Change the bulb.", "Ganti bohlamnya."),
            ("Your partner asks how the slow cooker works.", "Pasanganmu bertanya cara kerja slow cooker.", "Add the food, set it to low, and leave it for six hours.", "Masukkan makanan, atur ke low, dan biarkan enam jam.", "It cooks slowly.", "Itu memasak pelan."),
            ("Your child asks how the doorbell camera works.", "Anakmu bertanya cara kerja kamera bel.", "When someone presses the bell, the phone shows their face.", "Saat seseorang menekan bel, ponsel menampilkan wajah mereka.", "It shows people.", "Itu menampilkan orang."),
            ("Your father asks how to reset the modem.", "Ayah bertanya cara mereset modem.", "Unplug it, wait thirty seconds, plug it back in, and wait for the green light.", "Cabut, tunggu tiga puluh detik, colokkan lagi, dan tunggu lampu hijau.", "Restart it.", "Nyalakan ulang."),
        ],
    },
    {
        "meta": {
            "id": "home-household-decisions",
            "title": "Household Decisions",
            "titleId": "Keputusan Rumah Tangga",
            "description": "Bahasa untuk anggaran, jadwal, dan keputusan bersama di rumah.",
            "prompt": ("What do you say to decide together?", "Apa yang kamu katakan untuk memutuskan bersama?"),
            "tag": "anggaran",
        },
        "structure": FUTURE,
        "rows": [
            ("You and your partner are choosing a weekend plan.", "Kamu dan pasangan memilih rencana akhir pekan.", "Let's stay home on Saturday and visit your parents on Sunday.", "Mari di rumah hari Sabtu dan mengunjungi orang tuamu hari Minggu.", "Let's decide later.", "Nanti saja diputuskan."),
            ("The electricity bill is higher than usual.", "Tagihan listrik lebih tinggi dari biasanya.", "We should use the air conditioner less and check the bill together tonight.", "Kita sebaiknya mengurangi AC dan memeriksa tagihan bersama malam ini.", "The bill is high.", "Tagihannya tinggi."),
            ("You want a new fridge, but money is tight.", "Kamu ingin kulkas baru, tapi uang sedang ketat.", "We can save for two months and buy the smaller fridge.", "Kita bisa menabung dua bulan dan membeli kulkas yang lebih kecil.", "We need a fridge.", "Kita butuh kulkas."),
            ("Both of you want the car on Friday.", "Kalian berdua butuh mobil hari Jumat.", "I can take the bus, and you can keep the car for the school run.", "Saya bisa naik bus, dan kamu pakai mobil untuk antar sekolah.", "We both need the car.", "Kita berdua butuh mobil."),
            ("A relative asks to stay for a week.", "Kerabat minta menginap seminggu.", "They can stay three nights, and we will tell them the spare room is small.", "Mereka bisa menginap tiga malam, dan kita beri tahu kamar tamunya kecil.", "They can stay.", "Mereka bisa menginap."),
            ("You are choosing a school activity fee.", "Kamu memilih biaya kegiatan sekolah.", "We will pay for the museum trip and skip the optional camp this term.", "Kita akan membayar kunjungan museum dan melewati kemah opsional semester ini.", "School costs money.", "Sekolah butuh biaya."),
            ("Dinner time keeps changing.", "Waktu makan malam terus berubah.", "Let's eat at seven on weekdays so the children have a steady routine.", "Mari makan pukul tujuh di hari kerja supaya anak-anak punya rutinitas tetap.", "Dinner is late.", "Makan malam terlambat."),
            ("You found a cheaper market further away.", "Kamu menemukan pasar yang lebih murah tapi lebih jauh.", "We can shop there on Sunday morning and keep the corner store for weekdays.", "Kita bisa belanja di sana Minggu pagi dan tetap ke warung untuk hari kerja.", "The market is cheaper.", "Pasar itu lebih murah."),
            ("The roof needs repair before the rainy season.", "Atap perlu diperbaiki sebelum musim hujan.", "We should call the builder this week and set a budget before the work starts.", "Kita sebaiknya menghubungi tukang minggu ini dan menetapkan anggaran sebelum pekerjaan mulai.", "The roof needs work.", "Atap perlu dikerjakan."),
            ("You disagree about a new phone.", "Kalian tidak setuju soal ponsel baru.", "I will keep this phone until it stops working, and we will review the price then.", "Saya akan memakai ponsel ini sampai berhenti bekerja, lalu kita tinjau harganya.", "I want a new phone.", "Saya ingin ponsel baru."),
            ("Chore lists are uneven.", "Daftar tugas rumah tidak seimbang.", "I will cook on weeknights, and you will handle laundry on Saturday.", "Saya memasak di malam hari kerja, dan kamu mengurus cucian hari Sabtu.", "The chores are uneven.", "Tugasnya tidak seimbang."),
            ("You are planning a small birthday at home.", "Kamu merencanakan ulang tahun kecil di rumah.", "We will invite six people, cook at home, and skip the restaurant.", "Kita mengundang enam orang, memasak di rumah, dan melewati restoran.", "We should have a party.", "Kita sebaiknya mengadakan pesta."),
        ],
    },
    {
        "meta": {
            "id": "home-morning-plan",
            "title": "Morning Plan",
            "titleId": "Rencana Pagi",
            "description": "Rencana pagi keluarga: sarapan, sekolah, dan siapa melakukan apa.",
            "prompt": ("What is the morning plan?", "Apa rencana paginya?"),
            "tag": "pagi",
        },
        "rows": [
            ("It is 6 a.m. and everyone is still in bed.", "Pukul enam pagi dan semua orang masih di tempat tidur.", "I will wake the children at six fifteen and start breakfast.", "Saya akan membangunkan anak-anak pukul enam lewat lima belas dan mulai sarapan.", "We should get up.", "Kita sebaiknya bangun."),
            ("Your partner asks who is driving.", "Pasanganmu bertanya siapa yang mengantar.", "I will drive the children to school, and you can leave for work after that.", "Saya akan mengantar anak-anak ke sekolah, dan kamu bisa berangkat kerja setelah itu.", "Someone should drive.", "Seseorang harus mengantar."),
            ("The school bag is not packed.", "Tas sekolah belum beres.", "I will pack the bag after breakfast and check the homework folder.", "Saya akan membereskan tas setelah sarapan dan memeriksa map PR.", "The bag is not ready.", "Tasnya belum siap."),
            ("There is no bread.", "Roti habis.", "We can have eggs and fruit, and I will buy bread on the way home.", "Kita bisa makan telur dan buah, dan saya akan membeli roti saat pulang.", "There is no bread.", "Roti habis."),
            ("Your child cannot find their shoes.", "Anakmu tidak menemukan sepatunya.", "The shoes are by the door, and I will help you put them on.", "Sepatunya di dekat pintu, dan saya akan membantumu memakainya.", "Find your shoes.", "Cari sepatumu."),
            ("Rain is starting.", "Hujan mulai turun.", "Take the blue raincoat, and I will bring the umbrella to the car.", "Pakai jas hujan biru, dan saya akan membawa payung ke mobil.", "It is raining.", "Hujan."),
            ("Your partner has an early meeting.", "Pasanganmu punya rapat pagi.", "I will handle breakfast and the school run so you can leave at seven.", "Saya akan mengurus sarapan dan antar sekolah supaya kamu bisa berangkat pukul tujuh.", "You have a meeting.", "Kamu punya rapat."),
            ("The baby is still asleep.", "Bayinya masih tidur.", "Let the baby sleep, and I will feed the older child first.", "Biarkan bayi tidur, dan saya akan memberi makan anak yang lebih besar dulu.", "The baby is asleep.", "Bayinya tidur."),
            ("Homework was left on the table.", "PR tertinggal di meja.", "Put the worksheet in the folder now, and I will check the pencil case.", "Masukkan lembar kerja ke map sekarang, dan saya akan memeriksa kotak pensil.", "The homework is on the table.", "PR ada di meja."),
            ("You are running late.", "Kalian terlambat.", "Skip the long breakfast, take the bananas, and we will leave in five minutes.", "Lewati sarapan yang lama, ambil pisangnya, dan kita berangkat dalam lima menit.", "We are late.", "Kita terlambat."),
            ("Your child wants to watch a video.", "Anakmu ingin menonton video.", "No video before school. You can watch one after homework tonight.", "Tidak ada video sebelum sekolah. Kamu boleh menonton satu setelah PR malam ini.", "Not now.", "Jangan sekarang."),
            ("The uniform is still damp.", "Seragamnya masih lembap.", "Wear the spare shirt, and I will dry this one for tomorrow.", "Pakai kemeja cadangan, dan saya akan mengeringkan yang ini untuk besok.", "The shirt is wet.", "Kemejanya basah."),
            ("Medicine needs to be taken with food.", "Obat perlu diminum dengan makanan.", "Eat the toast first, then take the tablet with water.", "Makan rotinya dulu, lalu minum tablet dengan air.", "Take the medicine.", "Minum obatnya."),
            ("Two children need different drop-off times.", "Dua anak punya waktu antar yang berbeda.", "We will drop off the older one at seven thirty and the younger one at eight.", "Kita antar yang lebih besar pukul tujuh tiga puluh dan yang lebih kecil pukul delapan.", "They leave at different times.", "Mereka berangkat di waktu berbeda."),
            ("Your mother is visiting this morning.", "Ibu berkunjung pagi ini.", "I will leave the key under the mat and call her when we reach school.", "Saya akan meninggalkan kunci di bawah keset dan meneleponnya saat kami sampai di sekolah.", "Mother is coming.", "Ibu akan datang."),
        ],
    },
    {
        "meta": {
            "id": "home-emergency",
            "title": "Home Emergency",
            "titleId": "Darurat Rumah",
            "description": "Kabar tenang saat bocor, listrik mati, atau seseorang sakit.",
            "prompt": ("What do you say right now?", "Apa yang kamu katakan sekarang?"),
            "tag": "darurat",
        },
        "rows": [
            ("Water is coming through the kitchen ceiling.", "Air masuk dari langit-langit dapur.", "The kitchen ceiling is leaking. I turned off the upstairs tap and put a bucket down.", "Langit-langit dapur bocor. Saya mematikan keran lantai atas dan meletakkan ember.", "There is water.", "Ada air."),
            ("The power is out in the whole house.", "Listrik mati di seluruh rumah.", "The power is out. I checked the breaker, and I will call the neighbor to see if their lights are on.", "Listrik mati. Saya memeriksa breaker, dan saya akan menelepon tetangga untuk melihat apakah lampu mereka menyala.", "The power is out.", "Listrik mati."),
            ("Your child has a high fever.", "Anakmu demam tinggi.", "His temperature is thirty-nine. I gave him water, and we should leave for the clinic now.", "Suhunya tiga puluh sembilan. Saya memberinya air, dan kita sebaiknya berangkat ke klinik sekarang.", "He is sick.", "Dia sakit."),
            ("You smell gas near the stove.", "Kamu mencium gas di dekat kompor.", "I smell gas. I opened the window, and nobody should touch the switches.", "Saya mencium gas. Saya membuka jendela, dan jangan ada yang menyentuh sakelar.", "I smell something.", "Saya mencium sesuatu."),
            ("A pipe burst under the sink.", "Pipa pecah di bawah wastafel.", "The pipe under the sink burst. I shut the main valve, and the floor is still wet.", "Pipa di bawah wastafel pecah. Saya menutup katup utama, dan lantainya masih basah.", "The pipe broke.", "Pipanya pecah."),
            ("Your parent fell in the bathroom.", "Orang tuamu jatuh di kamar mandi.", "Dad fell in the bathroom. He is awake and talking, and I am staying with him.", "Ayah jatuh di kamar mandi. Dia sadar dan bisa bicara, dan saya tetap di sampingnya.", "Dad fell.", "Ayah jatuh."),
            ("Smoke is coming from the toaster.", "Asap keluar dari pemanggang roti.", "The toaster is smoking. I unplugged it and moved it away from the curtain.", "Pemanggang roti berasap. Saya mencabutnya dan menjauhkannya dari gorden.", "There is smoke.", "Ada asap."),
            ("The baby swallowed a small button.", "Bayi menelan kancing kecil.", "The baby swallowed a button. She is breathing, and we are going to the hospital now.", "Bayi menelan kancing. Dia masih bernapas, dan kita berangkat ke rumah sakit sekarang.", "The baby swallowed something.", "Bayi menelan sesuatu."),
            ("A window broke in the storm.", "Jendela pecah karena badai.", "The bedroom window broke. I moved the children out of that room and covered the frame with a sheet.", "Jendela kamar pecah. Saya memindahkan anak-anak dari kamar itu dan menutup bingkainya dengan kain.", "The window broke.", "Jendelanya pecah."),
            ("You cannot find your younger child in the yard.", "Kamu tidak menemukan anak kecil di halaman.", "I cannot see Ari in the yard. I am checking the gate, and please call his name from the street.", "Saya tidak melihat Ari di halaman. Saya memeriksa pagar, dan tolong panggil namanya dari jalan.", "Ari is missing.", "Ari tidak kelihatan."),
            ("The fridge stopped and the food is warm.", "Kulkas berhenti dan makanannya hangat.", "The fridge stopped two hours ago. I moved the milk to the cooler, and the meat should be cooked tonight.", "Kulkas berhenti dua jam lalu. Saya memindahkan susu ke kotak pendingin, dan dagingnya sebaiknya dimasak malam ini.", "The fridge stopped.", "Kulkas berhenti."),
            ("A stranger is trying the front gate.", "Orang asing mencoba pagar depan.", "Someone is trying the front gate. I locked the door, and I am calling you from the bedroom.", "Seseorang mencoba pagar depan. Saya mengunci pintu, dan saya meneleponmu dari kamar.", "Someone is outside.", "Ada seseorang di luar."),
            ("Your partner cut their hand while cooking.", "Pasanganmu tergores saat memasak.", "Your hand is bleeding. Press this cloth on it, and I will drive you to the clinic if it does not stop.", "Tanganmu berdarah. Tekan kain ini, dan saya akan mengantarmu ke klinik jika tidak berhenti.", "You are bleeding.", "Kamu berdarah."),
            ("The street is flooding toward the house.", "Jalan banjir menuju rumah.", "Water is at the front step. I moved the bags upstairs and unplugged the ground-floor sockets.", "Air sudah di anak tangga depan. Saya memindahkan tas ke atas dan mencabut stopkontak lantai bawah.", "The street is flooding.", "Jalan banjir."),
            ("The dog got out.", "Anjingnya keluar.", "The dog is outside the gate. I have his leash, and I am walking toward the park.", "Anjing ada di luar pagar. Saya membawa talinya, dan saya berjalan ke arah taman.", "The dog is out.", "Anjingnya keluar."),
            ("Medicine was taken twice by mistake.", "Obat terminum dua kali karena keliru.", "Grandma took the tablet twice. She is awake, and I am calling the clinic to ask what to do.", "Nenek minum tablet dua kali. Dia sadar, dan saya menelepon klinik untuk menanyakan apa yang harus dilakukan.", "She took too much.", "Dia minum terlalu banyak."),
            ("A candle fell onto the rug.", "Lilin jatuh ke karpet.", "The candle fell. I put it out with a wet towel, and the rug is damaged but not burning.", "Lilin jatuh. Saya memadamkannya dengan handuk basah, dan karpetnya rusak tapi tidak terbakar.", "There was a candle.", "Ada lilin."),
            ("You locked the keys inside.", "Kamu mengunci kunci di dalam rumah.", "The keys are inside. The children are with me outside, and I will call the neighbor who has the spare key.", "Kuncinya di dalam. Anak-anak bersama saya di luar, dan saya akan menelepon tetangga yang menyimpan kunci cadangan.", "We are locked out.", "Kita terkunci di luar."),
        ],
    },
]


def extend_modules() -> list[dict]:
    more = [
        {
            "meta": {
                "id": "home-family-update",
                "title": "Family Update",
                "titleId": "Kabar ke Keluarga",
                "description": "Status singkat, risiko, dan permintaan keputusan ke pasangan atau orang tua.",
                "prompt": ("What update do you give?", "Kabar apa yang kamu sampaikan?"),
                "tag": "kabar",
            },
            "rows": [
                ("Your partner is still at work.", "Pasanganmu masih di kantor.", "The children are home, dinner is started, and I need you to buy milk on the way back.", "Anak-anak sudah di rumah, makan malam sudah mulai, dan saya perlu kamu membeli susu saat pulang.", "The children are home.", "Anak-anak di rumah."),
                ("Your mother calls in the afternoon.", "Ibu menelepon sore hari.", "Dad took his medicine, the nurse comes at four, and I will stay until you arrive.", "Ayah sudah minum obat, perawat datang pukul empat, dan saya akan tinggal sampai kamu tiba.", "Dad is fine.", "Ayah baik-baik saja."),
                ("You are delayed at the market.", "Kamu terlambat di pasar.", "The market queue is long. I will be home at six, and please start the rice.", "Antrean pasar panjang. Saya akan di rumah pukul enam, dan tolong mulai masak nasinya.", "I am late.", "Saya terlambat."),
                ("School sent a note.", "Sekolah mengirim catatan.", "The teacher wants a meeting on Thursday. Nothing is urgent, but we should both go.", "Guru ingin pertemuan hari Kamis. Tidak mendesak, tapi kita sebaiknya pergi berdua.", "The teacher wrote.", "Guru menulis."),
                ("The repair quote arrived.", "Penawaran perbaikan sudah datang.", "The plumber quoted one million. I think we should accept it before Friday's rain.", "Tukang ledeng menawar satu juta. Saya pikir kita sebaiknya menerima sebelum hujan Jumat.", "The quote arrived.", "Penawarannya datang."),
                ("Your child finished homework.", "Anakmu selesai PR.", "Homework is done, he still needs to read for fifteen minutes, and then he can play outside.", "PR selesai, dia masih perlu membaca lima belas menit, lalu boleh bermain di luar.", "Homework is done.", "PR selesai."),
                ("You are caring for a sick parent overnight.", "Kamu menjaga orang tua yang sakit semalaman.", "Mom slept for two hours, her fever is down, and I will call you if it rises again.", "Ibu tidur dua jam, demamnya turun, dan saya akan meneleponmu jika naik lagi.", "Mom is sleeping.", "Ibu sedang tidur."),
                ("Rent is due tomorrow.", "Sewa jatuh tempo besok.", "Rent is due tomorrow. I can transfer my half tonight if you send yours in the morning.", "Sewa jatuh tempo besok. Saya bisa transfer bagian saya malam ini jika kamu mengirim bagianmu pagi hari.", "Rent is due.", "Sewa jatuh tempo."),
                ("The school bus is cancelled.", "Bus sekolah dibatalkan.", "The bus is cancelled tomorrow. I can do the morning drop-off if you can collect them at two.", "Bus dibatalkan besok. Saya bisa antar pagi jika kamu bisa menjemput pukul dua.", "The bus is cancelled.", "Bus dibatalkan."),
                ("A package arrived damaged.", "Paket datang dalam keadaan rusak.", "The package arrived torn. The plates inside look intact, and I took photos before opening the rest.", "Paket datang sobek. Piring di dalamnya terlihat utuh, dan saya memotret sebelum membuka sisanya.", "The package is damaged.", "Paketnya rusak."),
                ("You changed the dinner plan.", "Kamu mengubah rencana makan malam.", "I switched dinner to soup because the chicken did not thaw. We still eat at seven.", "Saya mengganti makan malam menjadi sup karena ayamnya belum mencair. Kita tetap makan pukul tujuh.", "Dinner changed.", "Makan malam berubah."),
                ("Your brother offered to help move furniture.", "Kakakmu menawarkan bantuan memindahkan furnitur.", "He can come at nine on Saturday. We should clear the hallway before he arrives.", "Dia bisa datang pukul sembilan hari Sabtu. Kita sebaiknya mengosongkan lorong sebelum dia tiba.", "He can help.", "Dia bisa membantu."),
                ("The clinic moved an appointment.", "Klinik memindahkan janji.", "Grandma's appointment moved to Wednesday at ten. I can take her if you cover the school pickup.", "Janji Nenek pindah ke Rabu pukul sepuluh. Saya bisa mengantarnya jika kamu mengurus jemput sekolah.", "The appointment moved.", "Janjinya pindah."),
                ("You spent more than planned.", "Kamu belanja melebihi rencana.", "I spent extra on fruit and medicine. The weekly food budget is now short by fifty thousand.", "Saya belanja ekstra untuk buah dan obat. Anggaran makanan mingguan kurang lima puluh ribu.", "I spent more.", "Saya belanja lebih."),
                ("The children had an argument.", "Anak-anak bertengkar.", "They argued about the tablet. I separated them, and we should talk about the rule after dinner.", "Mereka bertengkar soal tablet. Saya memisahkan mereka, dan kita sebaiknya bicara soal aturannya setelah makan malam.", "They argued.", "Mereka bertengkar."),
                ("A neighbor complained about the dog.", "Tetangga mengeluh soal anjing.", "The neighbor said the dog barked at dawn. I will walk him earlier and close the side gate.", "Tetangga bilang anjing menggonggong saat fajar. Saya akan mengajaknya jalan lebih awal dan menutup pagar samping.", "The dog barked.", "Anjing menggonggong."),
                ("You finished the laundry.", "Kamu selesai mencuci.", "Laundry is done and folded. The school uniforms are on the chair, and one sock is missing.", "Cucian selesai dan dilipat. Seragam sekolah ada di kursi, dan satu kaus kaki hilang.", "Laundry is done.", "Cucian selesai."),
                ("Rain may cancel the picnic.", "Hujan mungkin membatalkan piknik.", "Rain is likely on Sunday morning. I suggest we move the picnic to the afternoon or stay in.", "Hujan mungkin turun Minggu pagi. Saya sarankan piknik dipindah ke sore atau tetap di rumah.", "It may rain.", "Mungkin hujan."),
            ],
        },
        {
            "meta": {
                "id": "home-messages",
                "title": "Home Messages",
                "titleId": "Pesan Rumah",
                "description": "Pesan singkat ke keluarga, tetangga, sekolah, atau pemilik rumah.",
                "prompt": ("What message do you send?", "Pesan apa yang kamu kirim?"),
                "tag": "pesan",
            },
            "rows": [
                ("You need your partner to buy eggs.", "Kamu perlu pasangan membeli telur.", "Please buy ten eggs on the way home. We need them for breakfast.", "Tolong beli sepuluh telur saat pulang. Kita membutuhkannya untuk sarapan.", "Buy eggs.", "Beli telur."),
                ("You are telling a neighbor about a package.", "Kamu memberi tahu tetangga soal paket.", "A package for you arrived at our door. You can collect it after five.", "Paket untukmu tiba di pintu kami. Kamu bisa mengambilnya setelah pukul lima.", "Your package is here.", "Paketmu di sini."),
                ("You are writing to the landlord about a leak.", "Kamu menulis ke pemilik rumah soal kebocoran.", "The kitchen ceiling has been leaking since last night. Could you send someone this week?", "Langit-langit dapur bocor sejak semalam. Bisakah Anda mengirim seseorang minggu ini?", "There is a leak.", "Ada kebocoran."),
                ("You are messaging the teacher.", "Kamu mengirim pesan ke guru.", "Raka will be absent tomorrow because he has a fever. I will send the homework photo tonight.", "Raka tidak masuk besok karena demam. Saya akan mengirim foto PR malam ini.", "Raka is absent.", "Raka tidak masuk."),
                ("You are asking a sibling to check on your parents.", "Kamu meminta saudara mengecek orang tua.", "Can you look in on Mom and Dad this evening? I cannot leave work before eight.", "Bisakah kamu menengok Ibu dan Ayah sore ini? Saya tidak bisa pulang sebelum pukul delapan.", "Please visit them.", "Tolong jenguk mereka."),
                ("You are replying to a cousin about lunch.", "Kamu membalas sepupu soal makan siang.", "Sunday lunch at our place still works. Please arrive around twelve, and we have enough chairs.", "Makan siang Minggu di tempat kami tetap jalan. Silakan datang sekitar pukul dua belas, dan kursi kami cukup.", "Lunch is on.", "Makan siangnya jadi."),
                ("You are texting about a spare key.", "Kamu mengirim pesan soal kunci cadangan.", "I left the spare key with Mrs. Dewi in house four. Please knock and say my name.", "Saya menitipkan kunci cadangan ke Bu Dewi di rumah empat. Tolong ketuk dan sebut nama saya.", "The key is with the neighbor.", "Kuncinya di tetangga."),
                ("You are warning the family about a wet floor.", "Kamu memperingatkan keluarga soal lantai basah.", "The hallway floor is wet. Please walk slowly until I finish mopping.", "Lantai lorong basah. Tolong berjalan pelan sampai saya selesai mengepel.", "The floor is wet.", "Lantainya basah."),
                ("You are asking the builder for a time.", "Kamu meminta waktu ke tukang.", "Can you come on Thursday morning to look at the roof? We will be home after eight.", "Bisakah Anda datang Kamis pagi untuk melihat atap? Kami di rumah setelah pukul delapan.", "Can you come?", "Bisakah Anda datang?"),
                ("You are cancelling a playdate.", "Kamu membatalkan janji main.", "We need to cancel today's playdate because Dina is coughing. Can we try Saturday instead?", "Kami perlu membatalkan janji main hari ini karena Dina batuk. Bisakah kita coba Sabtu saja?", "We cannot come.", "Kami tidak bisa datang."),
                ("You are thanking a neighbor.", "Kamu berterima kasih ke tetangga.", "Thank you for watching the dog this afternoon. I left some fruit by your door.", "Terima kasih sudah menjaga anjing sore ini. Saya meninggalkan buah di pintumu.", "Thank you.", "Terima kasih."),
                ("You are telling your child where you are.", "Kamu memberi tahu anakmu di mana kamu berada.", "I am at the pharmacy. Stay inside with Grandma, and I will be back in twenty minutes.", "Saya di apotek. Tetap di dalam bersama Nenek, dan saya kembali dalam dua puluh menit.", "I am out.", "Saya sedang keluar."),
                ("You are asking for a quieter evening.", "Kamu meminta malam yang lebih tenang.", "Please keep the music low after nine. The baby is finally asleep.", "Tolong pelankan musik setelah pukul sembilan. Bayinya baru saja tertidur.", "Please be quiet.", "Tolong tenang."),
                ("You are confirming a vegetable order.", "Kamu mengonfirmasi pesanan sayur.", "Please deliver the usual vegetables tomorrow morning, and add a kilo of tomatoes.", "Tolong antar sayur seperti biasa besok pagi, dan tambahkan satu kilo tomat.", "Deliver the vegetables.", "Antar sayurnya."),
                ("You are writing a short apology.", "Kamu menulis permintaan maaf singkat.", "Sorry we blocked your gate with the car. I have moved it, and it will not happen again.", "Maaf kami menutup pagar Anda dengan mobil. Saya sudah memindahkannya, dan ini tidak akan terulang.", "Sorry about the car.", "Maaf soal mobilnya."),
            ],
        },
        {
            "meta": {
                "id": "home-plans",
                "title": "Family Plans",
                "titleId": "Rencana Keluarga",
                "description": "Menjelaskan rencana liburan, renovasi, atau akhir pekan kepada keluarga.",
                "prompt": ("How do you explain the plan?", "Bagaimana kamu menjelaskan rencananya?"),
                "tag": "rencana",
            },
            "rows": [
                ("The family is choosing a short trip.", "Keluarga memilih perjalanan singkat.", "We leave Saturday at six, stay one night, and come home Sunday after lunch.", "Kita berangkat Sabtu pukul enam, menginap satu malam, dan pulang Minggu setelah makan siang.", "We are going away.", "Kita pergi."),
                ("You are explaining a kitchen renovation.", "Kamu menjelaskan renovasi dapur.", "The workers start Monday. We will cook in the back room for five days.", "Pekerjanya mulai Senin. Kita akan memasak di ruang belakang selama lima hari.", "The kitchen will be noisy.", "Dapur akan berisik."),
                ("Your child asks about the beach plan.", "Anakmu bertanya soal rencana pantai.", "We swim in the morning, eat at the warung, and leave before the rain.", "Kita berenang pagi, makan di warung, dan pulang sebelum hujan.", "We will go to the beach.", "Kita akan ke pantai."),
                ("You are planning Grandma's visit.", "Kamu merencanakan kunjungan Nenek.", "Grandma arrives Friday evening, sleeps in the front room, and leaves Sunday noon.", "Nenek tiba Jumat malam, tidur di ruang depan, dan pergi Minggu siang.", "Grandma is visiting.", "Nenek berkunjung."),
                ("You are describing a painting day.", "Kamu menjelaskan hari mengecat.", "We move the furniture on Saturday, paint on Sunday, and air the room on Monday.", "Kita pindahkan furnitur hari Sabtu, mengecat hari Minggu, dan mengangin-anginkan ruangan hari Senin.", "We will paint.", "Kita akan mengecat."),
                ("Your partner asks about the wedding trip.", "Pasanganmu bertanya soal perjalanan kondangan.", "We drive two hours, stay for the reception, and sleep at your uncle's house.", "Kita berkendara dua jam, tinggal untuk resepsi, dan tidur di rumah pamanmu.", "We are going to the wedding.", "Kita pergi ke kondangan."),
                ("You are planning a home birthday.", "Kamu merencanakan ulang tahun di rumah.", "Cake at four, games until five, and parents pick the children up at six.", "Kue pukul empat, permainan sampai pukul lima, dan orang tua menjemput anak-anak pukul enam.", "There will be a party.", "Akan ada pesta."),
                ("You are explaining a market morning.", "Kamu menjelaskan pagi ke pasar.", "I leave at seven, buy the week’s vegetables, and I am back before nine.", "Saya berangkat pukul tujuh, membeli sayur seminggu, dan kembali sebelum pukul sembilan.", "I am going to the market.", "Saya ke pasar."),
                ("The family might visit two houses.", "Keluarga mungkin mengunjungi dua rumah.", "We see your parents in the morning and my sister in the afternoon, then we drive home.", "Kita menemui orang tuamu pagi dan kakak saya sore, lalu pulang.", "We will visit people.", "Kita akan mengunjungi orang."),
                ("You are planning to deep-clean.", "Kamu merencanakan bersih-bersih besar.", "Bedrooms on Saturday morning, kitchen after lunch, and we stop at four.", "Kamar tidur Sabtu pagi, dapur setelah makan siang, dan kita berhenti pukul empat.", "We will clean.", "Kita akan bersih-bersih."),
                ("Your child asks about the new bookshelf.", "Anakmu bertanya soal rak buku baru.", "We build it on Sunday morning, and your books can move onto it the same day.", "Kita merakitnya Minggu pagi, dan bukumu bisa dipindah ke situ di hari yang sama.", "We will build a shelf.", "Kita akan merakit rak."),
                ("You are setting a rainy-day backup.", "Kamu menyiapkan rencana cadangan saat hujan.", "If it rains, we skip the park and watch the film at home after lunch.", "Jika hujan, kita melewati taman dan menonton film di rumah setelah makan siang.", "We might stay home.", "Kita mungkin di rumah."),
            ],
        },
        {
            "meta": {
                "id": "home-feedback",
                "title": "Home Feedback",
                "titleId": "Umpan Balik di Rumah",
                "description": "Masukan sopan soal tugas rumah, PR, dan pekerjaan rumah tangga.",
                "prompt": ("How do you give the feedback?", "Bagaimana kamu memberi masukannya?"),
                "tag": "umpan-balik",
            },
            "rows": [
                ("Your child rushed the homework.", "Anakmu mengerjakan PR terburu-buru.", "The answers are there, but three sentences are hard to read. Please rewrite those lines.", "Jawabannya ada, tapi tiga kalimat sulit dibaca. Tolong tulis ulang baris itu.", "This is messy.", "Ini berantakan."),
                ("Your partner left dishes in the sink.", "Pasanganmu meninggalkan piring di wastafel.", "The dishes are still in the sink. Can you wash them before we cook?", "Piring masih di wastafel. Bisakah kamu mencucinya sebelum kita memasak?", "You forgot the dishes.", "Kamu lupa piringnya."),
                ("Your child did not make the bed.", "Anakmu tidak merapikan tempat tidur.", "The bed is still unmade. Please do it before you go outside.", "Tempat tidur masih belum rapi. Tolong rapikan sebelum kamu ke luar.", "Your room is messy.", "Kamarmu berantakan."),
                ("A sibling's cooking was too salty.", "Masakan saudara terlalu asin.", "The soup tastes good, and it is a little salty for Dad. Next time we can add the salt at the end.", "Supnya enak, dan sedikit asin untuk Ayah. Lain kali garamnya bisa ditambah di akhir.", "This is too salty.", "Ini terlalu asin."),
                ("Your child forgot to water the plants.", "Anakmu lupa menyiram tanaman.", "The soil is dry. Please water the pots by the fence before sunset.", "Tanahnya kering. Tolong siram pot di pagar sebelum matahari terbenam.", "You forgot the plants.", "Kamu lupa tanamannya."),
                ("Shoes are in the hallway again.", "Sepatu lagi-lagi di lorong.", "Please put the shoes on the rack. The hallway needs to stay clear.", "Tolong letakkan sepatu di rak. Lorong perlu tetap kosong.", "Move your shoes.", "Pindahkan sepatumu."),
                ("Your teenager was rude at dinner.", "Anak remajamu kasar saat makan malam.", "I heard the tone at dinner. We can talk about it after the plates are cleared.", "Saya mendengar nadanya saat makan malam. Kita bisa membicarakannya setelah piring dibereskan.", "That was rude.", "Itu kasar."),
                ("The bathroom was left wet.", "Kamar mandi ditinggalkan basah.", "The floor is wet after your shower. Please wipe it so nobody slips.", "Lantai basah setelah kamu mandi. Tolong lap supaya tidak ada yang terpeleset.", "You left a mess.", "Kamu meninggalkan berantakan."),
                ("Homework is correct but unfinished.", "PR benar tapi belum selesai.", "The first page is right. Please finish the second page before the show.", "Halaman pertama benar. Tolong selesaikan halaman kedua sebelum acaranya.", "You are not finished.", "Kamu belum selesai."),
                ("Your partner bought the wrong rice.", "Pasanganmu membeli beras yang salah.", "This is the sweet rice. We need the usual bag next time, and we can still use this for porridge.", "Ini beras ketan. Kita butuh kemasan yang biasa lain kali, dan yang ini masih bisa untuk bubur.", "This is the wrong rice.", "Ini beras yang salah."),
                ("Your child left food on the table.", "Anakmu meninggalkan makanan di meja.", "Please take your plate to the sink and wipe the spot where the sauce dripped.", "Tolong bawa piringmu ke wastafel dan lap noda saus yang menetes.", "Clean your mess.", "Bersihkan berantakanmu."),
                ("A drawing was done on the wall.", "Ada gambar di dinding.", "The drawing is creative, and walls are not for markers. Let's move it to paper.", "Gambarnya kreatif, dan dinding bukan untuk spidol. Mari pindahkan ke kertas.", "Do not draw there.", "Jangan gambar di situ."),
                ("Laundry was mixed by color.", "Cucian tercampur warnanya.", "The white shirts went in with the dark clothes. Next time we separate them first.", "Kemeja putih masuk bersama baju gelap. Lain kali kita pisahkan dulu.", "You mixed the laundry.", "Kamu mencampur cucian."),
                ("Your child skipped reading time.", "Anakmu melewati waktu membaca.", "You played first. Please read for ten minutes, and then you can go back outside.", "Kamu bermain dulu. Tolong baca sepuluh menit, lalu kamu boleh kembali ke luar.", "You skipped reading.", "Kamu melewati waktu membaca."),
                ("Trash day was missed.", "Hari sampah terlewat.", "The bin is still inside. Please take it to the gate before the truck comes at seven.", "Tempat sampah masih di dalam. Tolong bawa ke pagar sebelum truk datang pukul tujuh.", "You forgot the trash.", "Kamu lupa sampah."),
            ],
        },
        {
            "meta": {
                "id": "home-after",
                "title": "After a Mishap",
                "titleId": "Setelah Kejadian",
                "description": "Rekap tenang setelah kejadian di rumah: apa yang terjadi, akibatnya, dan langkah berikutnya.",
                "prompt": ("How do you recap what happened?", "Bagaimana kamu merangkum yang terjadi?"),
                "tag": "rekap",
            },
            "rows": [
                ("The soup boiled over.", "Sup meluap.", "The soup boiled over because the heat stayed on high. I cleaned the stove, and next time I will lower it.", "Sup meluap karena apinya tetap besar. Saya membersihkan kompor, dan lain kali saya akan mengecilkannya.", "The soup spilled.", "Sup tumpah."),
                ("A glass broke during dinner.", "Gelas pecah saat makan malam.", "The glass broke when it slipped. Nobody was cut, and I swept the floor twice.", "Gelas pecah saat terpeleset. Tidak ada yang terluka, dan saya menyapu lantai dua kali.", "A glass broke.", "Gelas pecah."),
                ("The laundry shrank.", "Cucian menyusut.", "The sweater shrank because the water was too hot. We will wash wool by hand from now on.", "Sweater menyusut karena airnya terlalu panas. Mulai sekarang wol kita cuci dengan tangan.", "The sweater shrank.", "Sweater menyusut."),
                ("You missed the school pickup.", "Kamu telat menjemput sekolah.", "I arrived ten minutes late because the market queue ran long. I called the teacher, and the child was safe.", "Saya datang terlambat sepuluh menit karena antrean pasar panjang. Saya menelepon guru, dan anaknya aman.", "I was late.", "Saya terlambat."),
                ("Plants died in the heat.", "Tanaman mati karena panas.", "The pots dried out while we were away. I will ask the neighbor to water them next time.", "Pot mengering saat kami pergi. Lain kali saya akan meminta tetangga menyiramnya.", "The plants died.", "Tanamannya mati."),
                ("The cake burned.", "Kue gosong.", "The cake burned because the timer was off. The outside is dark, and I will bake another one tomorrow.", "Kue gosong karena pewaktunya mati. Bagian luarnya gelap, dan saya akan memanggang yang lain besok.", "The cake burned.", "Kue gosong."),
                ("Paint dripped on the floor.", "Cat menetes ke lantai.", "Paint dripped because the sheet did not cover the edge. I wiped it while it was wet.", "Cat menetes karena kain tidak menutupi tepinya. Saya mengelapnya selagi basah.", "Paint spilled.", "Cat tumpah."),
                ("A bill was paid twice.", "Tagihan terbayar dua kali.", "I paid the water bill twice by mistake. I called the office, and the extra payment becomes next month's credit.", "Saya membayar tagihan air dua kali karena keliru. Saya menelepon kantornya, dan kelebihannya menjadi kredit bulan depan.", "I paid twice.", "Saya bayar dua kali."),
                ("The dog chewed a shoe.", "Anjing mengunyah sepatu.", "The dog chewed a shoe because his toy was in the cupboard. I moved the shoes up and gave him the toy.", "Anjing mengunyah sepatu karena mainannya ada di lemari. Saya menaikkan sepatu dan memberinya mainan.", "The dog chewed a shoe.", "Anjing mengunyah sepatu."),
                ("You forgot to lock the gate.", "Kamu lupa mengunci pagar.", "The gate stayed open for an hour. Nothing is missing, and I locked it as soon as I noticed.", "Pagar terbuka selama satu jam. Tidak ada yang hilang, dan saya menguncinya begitu menyadarinya.", "The gate was open.", "Pagar terbuka."),
                ("Milk spoiled.", "Susu basi.", "The milk spoiled because it sat out during breakfast. I threw it away and bought a new carton.", "Susu basi karena dibiarkan di luar saat sarapan. Saya membuangnya dan membeli karton baru.", "The milk spoiled.", "Susu basi."),
                ("A guest left unhappy.", "Tamu pulang kurang nyaman.", "We started dinner late, so my uncle left before dessert. I will call him tomorrow and explain.", "Kami mulai makan malam terlambat, jadi paman pulang sebelum hidangan penutup. Saya akan meneleponnya besok dan menjelaskan.", "He left early.", "Dia pulang lebih awal."),
            ],
        },
        {
            "meta": {
                "id": "home-neighbors",
                "title": "Neighbors and Trades",
                "titleId": "Tetangga dan Tukang",
                "description": "Bahasa sopan dengan tetangga, sekolah, dan tukang.",
                "prompt": ("What do you say?", "Apa yang kamu katakan?"),
                "tag": "tetangga",
            },
            "rows": [
                ("A neighbor's tree drops leaves into your yard.", "Pohon tetangga menjatuhkan daun ke halamanmu.", "The leaves from your tree are filling our drain. Could you trim the branch this month?", "Daun dari pohon Anda memenuhi selokan kami. Bisakah Anda memangkas dahannya bulan ini?", "Your tree is a problem.", "Pohon Anda masalah."),
                ("You need a plumber to come sooner.", "Kamu perlu tukang ledeng datang lebih cepat.", "The leak is getting worse. Can you come tomorrow morning instead of next week?", "Bocornya makin parah. Bisakah Anda datang besok pagi, bukan minggu depan?", "Come sooner.", "Datang lebih cepat."),
                ("The school asks for a volunteer.", "Sekolah meminta sukarelawan.", "I can help at the gate on Wednesday morning, but I cannot stay after ten.", "Saya bisa membantu di gerbang Rabu pagi, tapi saya tidak bisa tinggal setelah pukul sepuluh.", "I might help.", "Saya mungkin membantu."),
                ("A neighbor plays music late.", "Tetangga memutar musik sampai larut.", "The music is still loud after ten, and the baby wakes up. Could you lower it after nine?", "Musik masih keras setelah pukul sepuluh, dan bayi terbangun. Bisakah Anda pelankan setelah pukul sembilan?", "Your music is loud.", "Musik Anda keras."),
                ("The builder wants to start earlier than agreed.", "Tukang ingin mulai lebih awal dari kesepakatan.", "Seven is too early for our street. Please start at eight, as we agreed.", "Pukul tujuh terlalu pagi untuk jalan kami. Tolong mulai pukul delapan, seperti yang kita sepakati.", "Do not come early.", "Jangan datang pagi."),
                ("You borrowed a ladder.", "Kamu meminjam tangga.", "Thank you for the ladder. I will return it this evening, and I wiped the steps.", "Terima kasih untuk tangganya. Saya kembalikan sore ini, dan saya sudah mengelap anak tangganya.", "Here is your ladder.", "Ini tangga Anda."),
                ("A vendor delivered the wrong gas.", "Penjual mengantar gas yang salah.", "This is the small cylinder. We ordered the usual size, so please exchange it today.", "Ini tabung kecil. Kami memesan ukuran yang biasa, jadi tolong ditukar hari ini.", "This is wrong.", "Ini salah."),
                ("You are asking the school to repeat a notice.", "Kamu meminta sekolah mengulang pengumuman.", "I missed the time of the meeting. Could you send the notice again?", "Saya terlewat waktu pertemuannya. Bisakah Anda mengirim pengumuman itu lagi?", "What time is it?", "Jam berapa?"),
                ("A neighbor's dog keeps entering.", "Anjing tetangga terus masuk.", "Your dog came into our kitchen again. Please close your side gate in the afternoon.", "Anjing Anda masuk ke dapur kami lagi. Tolong tutup pagar samping Anda sore hari.", "Control your dog.", "Kendalikan anjing Anda."),
                ("The electrician finished but left a mess.", "Tukang listrik selesai tapi meninggalkan berantakan.", "The lights work, and there is dust on the floor. Could you vacuum before you leave?", "Lampunya berfungsi, dan ada debu di lantai. Bisakah Anda menyedotnya sebelum pergi?", "Clean this up.", "Bersihkan ini."),
                ("You want to share fruit with the next house.", "Kamu ingin berbagi buah dengan rumah sebelah.", "We have extra mangoes from the tree. Please take a bag if you would like some.", "Kami punya mangga lebih dari pohon. Silakan ambil satu kantong jika Anda mau.", "Do you want fruit?", "Anda mau buah?"),
                ("A parking spot is blocked.", "Tempat parkir terhalang.", "Your motorbike is in front of our gate. Could you move it so we can leave for school?", "Motor Anda di depan pagar kami. Bisakah Anda memindahkannya supaya kami bisa berangkat ke sekolah?", "Move your motorbike.", "Pindahkan motor Anda."),
            ],
        },
        {
            "meta": {
                "id": "home-conversations",
                "title": "Home Conversations",
                "titleId": "Obrolan di Rumah",
                "description": "Percakapan dengan pasangan, anak, atau orang tua tentang hari, perasaan, dan kebutuhan.",
                "prompt": ("What do you say next?", "Apa yang kamu katakan selanjutnya?"),
                "tag": "obrolan",
            },
            "rows": [
                ("Your partner looks tired after work.", "Pasanganmu terlihat lelah sepulang kerja.", "Sit down. I will finish dinner, and you can tell me about the day after we eat.", "Duduklah. Saya akan menyelesaikan makan malam, dan kamu bisa cerita tentang hari ini setelah kita makan.", "You look tired.", "Kamu terlihat lelah."),
                ("Your child is nervous about a test.", "Anakmu gugup menghadapi ulangan.", "We can review ten words after dinner. You do not have to get every one right.", "Kita bisa mengulang sepuluh kata setelah makan malam. Kamu tidak harus benar semuanya.", "Do not worry.", "Jangan khawatir."),
                ("Your mother says she feels lonely.", "Ibu mengatakan dia merasa kesepian.", "I can visit on Wednesday afternoon, and we can call every evening this week.", "Saya bisa berkunjung Rabu sore, dan kita bisa menelepon setiap malam minggu ini.", "I am busy.", "Saya sibuk."),
                ("Your partner wants a quiet evening.", "Pasanganmu ingin malam yang tenang.", "Then we will skip the film. I will put the children to bed, and we can sit outside.", "Kalau begitu kita lewatkan filmnya. Saya akan menidurkan anak-anak, dan kita bisa duduk di luar.", "Okay.", "Baik."),
                ("Your child asks why you said no.", "Anakmu bertanya mengapa kamu bilang tidak.", "I said no because it is a school night. You can go to the playground on Saturday.", "Saya bilang tidak karena ini malam sekolah. Kamu bisa ke taman bermain hari Sabtu.", "Because I said so.", "Karena saya sudah bilang."),
                ("Your father does not want help.", "Ayah tidak ingin dibantu.", "I hear you. I will stay in the kitchen, and you can call me if the box is heavy.", "Saya mendengar. Saya akan tinggal di dapur, dan kamu bisa memanggil saya jika kotaknya berat.", "Let me do it.", "Biar saya yang mengerjakan."),
                ("Your partner forgot an errand.", "Pasanganmu lupa suatu urusan.", "The pharmacy is still open. I can go, and you can stay with the children.", "Apotek masih buka. Saya bisa pergi, dan kamu bisa tinggal dengan anak-anak.", "You forgot.", "Kamu lupa."),
                ("Your child wants to talk about a friend.", "Anakmu ingin bicara soal teman.", "I am listening. Tell me what happened, and we will not decide anything yet.", "Saya mendengarkan. Ceritakan apa yang terjadi, dan kita belum memutuskan apa pun.", "What did they do?", "Apa yang mereka lakukan?"),
                ("Your mother offers too much food.", "Ibu menawarkan terlalu banyak makanan.", "Thank you. We will take a small box home, and you should keep the rest for tomorrow.", "Terima kasih. Kami akan membawa kotak kecil pulang, dan sisanya sebaiknya Ibu simpan untuk besok.", "That is too much.", "Itu terlalu banyak."),
                ("Your partner asks how you feel.", "Pasanganmu bertanya bagaimana perasaanmu.", "I am tired, but I am glad we ate together. I would like to sleep early.", "Saya lelah, tapi saya senang kita makan bersama. Saya ingin tidur lebih awal.", "I am fine.", "Saya baik-baik saja."),
                ("Your teenager wants a later bedtime.", "Anak remajamu ingin tidur lebih larut.", "On Friday you can stay up until eleven. School nights stay at ten.", "Hari Jumat kamu boleh tidur pukul sebelas. Malam sekolah tetap pukul sepuluh.", "No.", "Tidak."),
                ("Your child apologizes.", "Anakmu meminta maaf.", "Thank you for saying that. Please put the toys back, and then we are finished with this.", "Terima kasih sudah mengatakannya. Tolong kembalikan mainannya, lalu kita selesai dengan ini.", "It is okay.", "Tidak apa-apa."),
            ],
        },
    ]
    built = []
    for spec in MODULES + more:
        built.append(module_from_rows(spec["meta"], spec["rows"], spec.get("structure", SVO)))
    return built


def live_dialogue_module() -> dict:
    scenes = [
        (
            "The kitchen ceiling is dripping while you talk to your partner on the phone.",
            "Langit-langit dapur menetes saat kamu berbicara dengan pasangan di telepon.",
            "Partner",
            "Pasangan",
            "I can hear water. What is happening?",
            "Saya mendengar air. Apa yang terjadi?",
            "The ceiling is dripping over the stove. I put a bucket there and turned off the upstairs tap.",
            "Langit-langit menetes di atas kompor. Saya meletakkan ember dan mematikan keran lantai atas.",
            "There is water.",
            "Ada air.",
            "darurat",
        ),
        (
            "Your mother asks for the evening plan.",
            "Ibu menanyakan rencana malam.",
            "Mother",
            "Ibu",
            "What are you doing with the children tonight?",
            "Apa yang kamu lakukan dengan anak-anak malam ini?",
            "We will eat at seven, they will read for fifteen minutes, and then they will sleep.",
            "Kami makan pukul tujuh, mereka membaca lima belas menit, lalu tidur.",
            "The usual.",
            "Seperti biasa.",
            "pagi",
        ),
        (
            "A neighbor asks you to move a conversation about noise outside.",
            "Tetangga mengajakmu bicara soal suara di luar.",
            "Neighbor",
            "Tetangga",
            "The music last night woke my father. Can we talk about it?",
            "Musik semalam membangunkan ayah saya. Bisakah kita membicarakannya?",
            "I am sorry. We will keep the music inside and turn it off by nine.",
            "Saya minta maaf. Kami akan menahan musik di dalam dan mematikannya pukul sembilan.",
            "It was not that loud.",
            "Tidak sekeras itu.",
            "tetangga",
        ),
        (
            "Your child asks why Saturday's trip changed.",
            "Anakmu bertanya mengapa perjalanan Sabtu berubah.",
            "Child",
            "Anak",
            "Are we still going to the beach?",
            "Apakah kita tetap ke pantai?",
            "Not this Saturday. It will rain, so we will visit Grandma and go to the beach next week.",
            "Tidak Sabtu ini. Akan hujan, jadi kita mengunjungi Nenek dan ke pantai minggu depan.",
            "Maybe.",
            "Mungkin.",
            "rencana",
        ),
        (
            "The plumber is at the door and your partner needs a decision.",
            "Tukang ledeng di pintu dan pasanganmu butuh keputusan.",
            "Partner",
            "Pasangan",
            "He can fix it today for a higher price. What should I tell him?",
            "Dia bisa memperbaiki hari ini dengan harga lebih tinggi. Apa yang harus saya katakan?",
            "Ask him to start today. The leak is spreading, and we will pay the higher price.",
            "Minta dia mulai hari ini. Bocornya melebar, dan kita akan membayar harga yang lebih tinggi.",
            "You decide.",
            "Kamu yang putuskan.",
            "anggaran",
        ),
        (
            "Your father wants to know how the fever night went.",
            "Ayah ingin tahu bagaimana malam demam itu.",
            "Father",
            "Ayah",
            "How was your mother through the night?",
            "Bagaimana ibumu semalaman?",
            "She slept after midnight, the fever came down, and I will take her temperature again at eight.",
            "Dia tidur setelah tengah malam, demamnya turun, dan saya akan mengukur suhunya lagi pukul delapan.",
            "She is better.",
            "Dia lebih baik.",
            "kesehatan",
        ),
    ]
    items = []
    for i, scene in enumerate(scenes, 1):
        scenario, scenario_id, role, role_id, ask, ask_id, correct, correct_id, near, near_id, tag = scene
        turns = [
            them_turn("t1", role, role_id, ask, ask_id),
            you_turn("t2", "You", "Kamu", correct, correct_id, near, near_id),
        ]
        items.append(dialogue_item(i, scenario, scenario_id, turns, tag))
    return {
        "id": "home-live-dialogue",
        "title": "Home Dialogue",
        "titleId": "Percakapan Berantai di Rumah",
        "description": "Latihan percakapan rumah dua giliran: dengarkan lawan bicara, lalu pilih dan ketik respons English-mu.",
        "persona": ["Rumah"],
        "status": "ready",
        "itemCount": len(items),
        "items": items,
    }


SPEAK_PACKS = [
    (
        "home-errands",
        "Home Errands",
        "Urusan Rumah",
        [
            ("Please buy milk and eggs on the way home.", "Tolong beli susu dan telur saat pulang.", ["Please buy milk", "and eggs", "on the way home"]),
            ("The pharmacy closes at eight tonight.", "Apotek tutup pukul delapan malam ini.", ["The pharmacy closes", "at eight", "tonight"]),
            ("I will collect the package after lunch.", "Saya akan mengambil paket setelah makan siang.", ["I will collect", "the package", "after lunch"]),
            ("Can you drop this letter at the post office?", "Bisakah kamu mengantar surat ini ke kantor pos?", ["Can you drop", "this letter", "at the post office"]),
            ("We need rice, soap, and fruit.", "Kita butuh beras, sabun, dan buah.", ["We need rice", "soap", "and fruit"]),
            ("The market is cheaper on Sunday morning.", "Pasar lebih murah Minggu pagi.", ["The market is cheaper", "on Sunday", "morning"]),
            ("I left the grocery list on the fridge.", "Saya meninggalkan daftar belanja di kulkas.", ["I left", "the grocery list", "on the fridge"]),
            ("Please refill the drinking water today.", "Tolong isi ulang air minum hari ini.", ["Please refill", "the drinking water", "today"]),
            ("The tailor will be ready on Friday.", "Penjahit akan selesai hari Jumat.", ["The tailor", "will be ready", "on Friday"]),
            ("I am paying the electricity bill online.", "Saya membayar tagihan listrik secara online.", ["I am paying", "the electricity bill", "online"]),
        ],
    ),
    (
        "home-family-report",
        "Family Report",
        "Kabar ke Keluarga",
        [
            ("The children are home and dinner has started.", "Anak-anak sudah di rumah dan makan malam sudah mulai.", ["The children are home", "and dinner", "has started"]),
            ("Dad took his medicine at four.", "Ayah minum obat pukul empat.", ["Dad took", "his medicine", "at four"]),
            ("I will be home by six.", "Saya akan di rumah pukul enam.", ["I will be home", "by six"]),
            ("Homework is done, and one page was hard.", "PR selesai, dan satu halaman sulit.", ["Homework is done", "and one page", "was hard"]),
            ("The plumber can come tomorrow morning.", "Tukang ledeng bisa datang besok pagi.", ["The plumber can come", "tomorrow", "morning"]),
            ("Rent is due tomorrow morning.", "Sewa jatuh tempo besok pagi.", ["Rent is due", "tomorrow", "morning"]),
            ("Grandma slept, and her fever is down.", "Nenek tidur, dan demamnya turun.", ["Grandma slept", "and her fever", "is down"]),
            ("The school bus is cancelled tomorrow.", "Bus sekolah dibatalkan besok.", ["The school bus", "is cancelled", "tomorrow"]),
            ("I spent extra on fruit and medicine.", "Saya belanja ekstra untuk buah dan obat.", ["I spent extra", "on fruit", "and medicine"]),
            ("We should both go to the teacher meeting.", "Kita sebaiknya pergi berdua ke pertemuan guru.", ["We should both go", "to the teacher", "meeting"]),
        ],
    ),
    (
        "home-daily",
        "Daily Home Talk",
        "Obrolan Harian di Rumah",
        [
            ("Breakfast is eggs and fruit today.", "Sarapan hari ini telur dan buah.", ["Breakfast is", "eggs and fruit", "today"]),
            ("Please put your shoes on the rack.", "Tolong letakkan sepatumu di rak.", ["Please put", "your shoes", "on the rack"]),
            ("Dinner will be ready at seven.", "Makan malam akan siap pukul tujuh.", ["Dinner will be ready", "at seven"]),
            ("The baby is finally asleep.", "Bayinya akhirnya tidur.", ["The baby", "is finally", "asleep"]),
            ("Can we eat outside tonight?", "Bisakah kita makan di luar malam ini?", ["Can we eat", "outside", "tonight"]),
            ("I washed the uniforms this morning.", "Saya mencuci seragam pagi ini.", ["I washed", "the uniforms", "this morning"]),
            ("Your book is on the front table.", "Bukumu ada di meja depan.", ["Your book is", "on the front", "table"]),
            ("Let's clean the kitchen after we eat.", "Mari bersihkan dapur setelah kita makan.", ["Let's clean", "the kitchen", "after we eat"]),
        ],
    ),
    (
        "home-planning",
        "Planning Together",
        "Rencana Bersama",
        [
            ("We leave on Saturday at six.", "Kita berangkat Sabtu pukul enam.", ["We leave", "on Saturday", "at six"]),
            ("If it rains, we will stay home.", "Jika hujan, kita akan di rumah.", ["If it rains", "we will", "stay home"]),
            ("The workers start on Monday morning.", "Pekerjanya mulai Senin pagi.", ["The workers start", "on Monday", "morning"]),
            ("Grandma arrives on Friday evening.", "Nenek tiba Jumat malam.", ["Grandma arrives", "on Friday", "evening"]),
            ("We can visit your parents first.", "Kita bisa mengunjungi orang tuamu dulu.", ["We can visit", "your parents", "first"]),
            ("Let's keep Sunday afternoon free.", "Mari kosongkan Minggu sore.", ["Let's keep", "Sunday afternoon", "free"]),
            ("The birthday cake is at four.", "Kue ulang tahun pukul empat.", ["The birthday cake", "is at", "four"]),
            ("We should set a budget before we book.", "Kita sebaiknya menetapkan anggaran sebelum memesan.", ["We should set", "a budget", "before we book"]),
        ],
    ),
    (
        "home-fixing",
        "Fixing Things",
        "Memperbaiki Sesuatu",
        [
            ("The tap is dripping in the bathroom.", "Keran menetes di kamar mandi.", ["The tap", "is dripping", "in the bathroom"]),
            ("I turned off the main water valve.", "Saya mematikan katup air utama.", ["I turned off", "the main", "water valve"]),
            ("The light bulb is cool enough to change.", "Bohlam sudah cukup dingin untuk diganti.", ["The light bulb", "is cool enough", "to change"]),
            ("Can you hold the ladder for me?", "Bisakah kamu memegangkan tangga untuk saya?", ["Can you hold", "the ladder", "for me"]),
            ("The washer stops before the spin cycle.", "Mesin cuci berhenti sebelum putaran kering.", ["The washer stops", "before", "the spin cycle"]),
            ("I will call the electrician this afternoon.", "Saya akan menelepon tukang listrik sore ini.", ["I will call", "the electrician", "this afternoon"]),
            ("This screw is loose on the fan.", "Sekrup ini longgar di kipas.", ["This screw", "is loose", "on the fan"]),
            ("The window does not close all the way.", "Jendela tidak tertutup sepenuhnya.", ["The window", "does not close", "all the way"]),
            ("Please do not use the broken socket.", "Tolong jangan memakai stopkontak yang rusak.", ["Please do not use", "the broken", "socket"]),
            ("I covered the leak with a bucket.", "Saya menutup tetesan dengan ember.", ["I covered", "the leak", "with a bucket"]),
        ],
    ),
]


def speak_item(pack_id: str, index: int, target: str, target_id: str, chunks: list[str]) -> dict:
    words = target.replace("?", "").replace(".", "").split()
    level = ("junior", "mid", "senior")[index % 3]
    return {
        "id": f"{pack_id}-{index:03d}",
        "category": pack_id,
        "level": level,
        "target": target,
        "targetId": target_id,
        "chunks": chunks,
        "scrambled": words,
        "keywords": [word.lower() for word in words if len(word) > 3][:3] or [words[0].lower()],
        "grammarPatterns": ["home_sentence"],
        "commonErrors": ["missing time or object", "wrong word order"],
        "scenario": "You are speaking at home, with family or about a household task.",
        "scenarioId": "Kamu berbicara di rumah, dengan keluarga atau tentang urusan rumah.",
        "modelAnswers": [target],
        "audio": None,
    }


VERBS = {
    "cook": ("cook", "cooks", "cooked", "memasak"),
    "wash": ("wash", "washes", "washed", "mencuci"),
    "water": ("water", "waters", "watered", "menyiram"),
    "call": ("call", "calls", "called", "menelepon"),
    "buy": ("buy", "buys", "bought", "membeli"),
    "lock": ("lock", "locks", "locked", "mengunci"),
    "open": ("open", "opens", "opened", "membuka"),
    "clean": ("clean", "cleans", "cleaned", "membersihkan"),
    "carry": ("carry", "carries", "carried", "membawa"),
    "check": ("check", "checks", "checked", "memeriksa"),
    "close": ("close", "closes", "closed", "menutup"),
    "fix": ("fix", "fixes", "fixed", "memperbaiki"),
    "pack": ("pack", "packs", "packed", "mengemas"),
    "pay": ("pay", "pays", "paid", "membayar"),
    "walk": ("walk", "walks", "walked", "berjalan"),
}

SUBJECTS = [
    ("I", "Saya", "don't", "Do", "I", False),
    ("You", "Kamu", "don't", "Do", "you", False),
    ("We", "Kami", "don't", "Do", "we", False),
    ("They", "Mereka", "don't", "Do", "they", False),
    ("She", "Dia", "doesn't", "Does", "she", True),
]


def sentence_case(tokens: list[str], end: str) -> str:
    words = tokens[:]
    if words:
        words[0] = words[0][:1].upper() + words[0][1:]
    return " ".join(words) + end


def build_drills() -> list[dict]:
    themes = {
        "dasar": [
            ("I", "wash", ["the", "plates"], "piring"),
            ("She", "cook", ["rice"], "nasi"),
            ("We", "clean", ["the", "kitchen"], "dapur"),
            ("They", "walk", ["the", "dog"], "anjing"),
            ("You", "open", ["the", "window"], "jendela"),
            ("I", "close", ["the", "gate"], "pagar"),
            ("She", "water", ["the", "plants"], "tanaman"),
            ("We", "buy", ["fruit"], "buah"),
            ("I", "pack", ["the", "bags"], "tas"),
            ("They", "check", ["the", "locks"], "kunci"),
        ],
        "pagi": [
            ("I", "pack", ["the", "school", "bag"], "tas sekolah"),
            ("She", "cook", ["breakfast"], "sarapan"),
            ("We", "walk", ["to", "school"], "ke sekolah"),
            ("You", "check", ["the", "homework"], "PR"),
            ("They", "wash", ["their", "faces"], "wajah mereka"),
        ],
        "darurat": [
            ("I", "call", ["the", "clinic"], "klinik"),
            ("She", "close", ["the", "gas"], "gas"),
            ("We", "carry", ["the", "bucket"], "ember"),
            ("You", "lock", ["the", "door"], "pintu"),
            ("They", "check", ["the", "breaker"], "breaker"),
        ],
        "kabar": [
            ("I", "call", ["my", "mother"], "ibu saya"),
            ("She", "check", ["the", "temperature"], "suhu"),
            ("We", "cook", ["dinner"], "makan malam"),
            ("You", "buy", ["the", "milk"], "susu"),
            ("They", "water", ["the", "garden"], "kebun"),
        ],
        "pesan": [
            ("I", "call", ["the", "landlord"], "pemilik rumah"),
            ("She", "buy", ["the", "medicine"], "obat"),
            ("We", "lock", ["the", "gate"], "pagar"),
            ("You", "open", ["the", "package"], "paket"),
            ("They", "wash", ["the", "uniforms"], "seragam"),
        ],
        "rencana": [
            ("We", "pack", ["the", "bags"], "tas"),
            ("I", "call", ["the", "driver"], "sopir"),
            ("She", "cook", ["for", "the", "trip"], "untuk perjalanan"),
            ("You", "check", ["the", "tickets"], "tiket"),
            ("They", "clean", ["the", "guest", "room"], "kamar tamu"),
        ],
        "umpan-balik": [
            ("I", "check", ["the", "homework"], "PR"),
            ("She", "wash", ["the", "plates"], "piring"),
            ("You", "close", ["the", "cupboard"], "lemari"),
            ("We", "clean", ["the", "table"], "meja"),
            ("They", "pack", ["the", "toys"], "mainan"),
        ],
        "tetangga": [
            ("I", "call", ["the", "neighbor"], "tetangga"),
            ("She", "close", ["the", "side", "gate"], "pagar samping"),
            ("We", "carry", ["the", "chairs"], "kursi"),
            ("You", "check", ["the", "fence"], "pagar"),
            ("They", "water", ["our", "plants"], "tanaman kami"),
        ],
        "obrolan": [
            ("I", "call", ["my", "father"], "ayah saya"),
            ("She", "cook", ["soup"], "sup"),
            ("We", "walk", ["after", "dinner"], "setelah makan malam"),
            ("You", "open", ["the", "photo", "album"], "album foto"),
            ("They", "wash", ["the", "fruit"], "buah"),
        ],
        "belanja": [
            ("I", "buy", ["vegetables"], "sayur"),
            ("She", "carry", ["the", "bags"], "tas"),
            ("We", "check", ["the", "prices"], "harga"),
            ("You", "pack", ["the", "groceries"], "belanjaan"),
            ("They", "buy", ["rice"], "beras"),
        ],
        "perbaikan": [
            ("I", "fix", ["the", "tap"], "keran"),
            ("She", "check", ["the", "fan"], "kipas"),
            ("We", "close", ["the", "window"], "jendela"),
            ("You", "call", ["the", "plumber"], "tukang ledeng"),
            ("They", "carry", ["the", "ladder"], "tangga"),
        ],
        "anggaran": [
            ("I", "pay", ["the", "rent"], "sewa"),
            ("She", "check", ["the", "bill"], "tagihan"),
            ("We", "buy", ["less", "meat"], "lebih sedikit daging"),
            ("You", "open", ["the", "savings", "book"], "buku tabungan"),
            ("They", "pay", ["the", "school", "fee"], "biaya sekolah"),
        ],
        "cerita": [
            ("I", "cook", ["the", "rice"], "nasi"),
            ("She", "wash", ["the", "curtains"], "gorden"),
            ("We", "walk", ["to", "the", "park"], "ke taman"),
            ("You", "call", ["your", "aunt"], "bibi kamu"),
            ("They", "clean", ["the", "yard"], "halaman"),
        ],
        "cara-kerja": [
            ("I", "open", ["the", "lid"], "penutup"),
            ("She", "check", ["the", "filter"], "filter"),
            ("We", "close", ["the", "valve"], "katup"),
            ("You", "wash", ["the", "filter"], "filter"),
            ("They", "lock", ["the", "panel"], "panel"),
        ],
        "masak": [
            ("I", "cook", ["the", "soup"], "sup"),
            ("She", "wash", ["the", "vegetables"], "sayur"),
            ("We", "buy", ["chicken"], "ayam"),
            ("You", "open", ["the", "rice", "cooker"], "rice cooker"),
            ("They", "clean", ["the", "pans"], "wajan"),
        ],
        "sekolah": [
            ("I", "pack", ["the", "lunch"], "bekal"),
            ("She", "check", ["the", "uniform"], "seragam"),
            ("We", "walk", ["to", "the", "gate"], "ke gerbang"),
            ("You", "call", ["the", "teacher"], "guru"),
            ("They", "carry", ["the", "projects"], "proyek"),
        ],
        "kesehatan": [
            ("I", "check", ["the", "fever"], "demam"),
            ("She", "call", ["the", "clinic"], "klinik"),
            ("We", "buy", ["the", "medicine"], "obat"),
            ("You", "wash", ["your", "hands"], "tanganmu"),
            ("They", "open", ["the", "window"], "jendela"),
        ],
        "tamu": [
            ("I", "cook", ["extra", "rice"], "nasi tambahan"),
            ("She", "clean", ["the", "guest", "room"], "kamar tamu"),
            ("We", "open", ["the", "front", "door"], "pintu depan"),
            ("You", "carry", ["the", "chairs"], "kursi"),
            ("They", "wash", ["the", "glasses"], "gelas"),
        ],
        "akhir-pekan": [
            ("I", "walk", ["in", "the", "park"], "di taman"),
            ("She", "cook", ["a", "big", "lunch"], "makan siang besar"),
            ("We", "clean", ["the", "bedrooms"], "kamar tidur"),
            ("You", "call", ["the", "family"], "keluarga"),
            ("They", "water", ["the", "garden"], "kebun"),
        ],
    }
    commands = ["NEGATIVE", "QUESTION", "PAST", "FUTURE"]
    subject_by_word = {row[0]: row for row in SUBJECTS}
    drills = []
    n = 0
    for theme, rows in themes.items():
        for index, (subject_word, verb_key, obj_tokens, obj_id) in enumerate(rows):
            n += 1
            subject, subject_id, aux_neg, aux_q, subject_lower, third = subject_by_word[subject_word]
            base, third_form, past, verb_id = VERBS[verb_key]
            verb = third_form if third else base
            command = commands[index % len(commands)]
            assemble_tokens = [subject, verb, *obj_tokens]
            obj_phrase = " ".join(obj_tokens)
            meaning = f"{subject_id} {verb_id} {obj_id}."
            assemble = {
                "tokens": assemble_tokens,
                "distractors": ["is", "are"],
                "sentence": sentence_case(assemble_tokens, "."),
                "sentenceId": meaning,
                "why": f"{subject} diikuti bentuk kata kerja yang sesuai, lalu objek.",
                "pattern": "SUBJECT + VERB + OBJECT",
                "slots": [
                    {"role": "Subject", "roleId": "Subjek", "text": subject},
                    {"role": "Verb", "roleId": "Kata kerja", "text": verb},
                    {"role": "Object", "roleId": "Objek", "text": obj_phrase},
                ],
            }
            if command == "NEGATIVE":
                transform_tokens = [subject, aux_neg, base, *obj_tokens]
                transform = {
                    "command": "NEGATIVE",
                    "commandId": "Ubah menjadi negatif",
                    "tokens": transform_tokens,
                    "distractors": ["not", "doesn't" if aux_neg == "don't" else "don't"],
                    "sentence": sentence_case(transform_tokens, "."),
                    "sentenceId": f"{subject_id} tidak {verb_id} {obj_id}.",
                    "why": f"{subject} memakai {aux_neg} + kata kerja dasar.",
                    "pattern": f"SUBJECT + {aux_neg} + VERB + OBJECT",
                    "slots": [
                        {"role": "Subject", "roleId": "Subjek", "text": subject},
                        {"role": "Auxiliary", "roleId": "Kata bantu", "text": aux_neg},
                        {"role": "Verb", "roleId": "Kata kerja", "text": base},
                        {"role": "Object", "roleId": "Objek", "text": obj_phrase},
                    ],
                }
            elif command == "QUESTION":
                transform_tokens = [aux_q, subject_lower, base, *obj_tokens]
                transform = {
                    "command": "QUESTION",
                    "commandId": "Ubah menjadi pertanyaan",
                    "tokens": transform_tokens,
                    "distractors": ["Is", "Are"],
                    "sentence": sentence_case(transform_tokens, "?"),
                    "sentenceId": f"Apakah {subject_id.lower()} {verb_id} {obj_id}?",
                    "why": f"Pertanyaan present simple dimulai dengan {aux_q}.",
                    "pattern": f"{aux_q} + SUBJECT + VERB + OBJECT",
                    "slots": [
                        {"role": "Auxiliary", "roleId": "Kata bantu", "text": aux_q},
                        {"role": "Subject", "roleId": "Subjek", "text": subject_lower},
                        {"role": "Verb", "roleId": "Kata kerja", "text": base},
                        {"role": "Object", "roleId": "Objek", "text": obj_phrase},
                    ],
                }
            elif command == "PAST":
                transform_tokens = [subject, past, *obj_tokens]
                transform = {
                    "command": "PAST",
                    "commandId": "Ubah menjadi past",
                    "tokens": transform_tokens,
                    "distractors": [base, "was"],
                    "sentence": sentence_case(transform_tokens, "."),
                    "sentenceId": f"{subject_id} {verb_id} {obj_id} (lampau).",
                    "why": "Bentuk lampau memakai kata kerja past, tanpa do.",
                    "pattern": "SUBJECT + PAST VERB + OBJECT",
                    "slots": [
                        {"role": "Subject", "roleId": "Subjek", "text": subject},
                        {"role": "Verb", "roleId": "Kata kerja", "text": past},
                        {"role": "Object", "roleId": "Objek", "text": obj_phrase},
                    ],
                }
            else:
                transform_tokens = [subject, "will", base, *obj_tokens]
                transform = {
                    "command": "FUTURE",
                    "commandId": "Ubah menjadi future",
                    "tokens": transform_tokens,
                    "distractors": ["going", "shall"],
                    "sentence": sentence_case(transform_tokens, "."),
                    "sentenceId": f"{subject_id} akan {verb_id} {obj_id}.",
                    "why": "Future sederhana memakai will + kata kerja dasar.",
                    "pattern": "SUBJECT + will + VERB + OBJECT",
                    "slots": [
                        {"role": "Subject", "roleId": "Subjek", "text": subject},
                        {"role": "Auxiliary", "roleId": "Kata bantu", "text": "will"},
                        {"role": "Verb", "roleId": "Kata kerja", "text": base},
                        {"role": "Object", "roleId": "Objek", "text": obj_phrase},
                    ],
                }
            drills.append(
                {
                    "theme": theme,
                    "id": f"home-{theme}-{n:03d}",
                    "level": "junior" if index % 2 == 0 else "mid",
                    "meaningId": meaning,
                    "pattern": "SUBJECT + VERB + OBJECT",
                    "assemble": assemble,
                    "transform": transform,
                }
            )
    return drills


def main() -> None:
    modules = extend_modules()
    modules.append(live_dialogue_module())
    modules_dir = HOME / "modules"
    modules_dir.mkdir(parents=True, exist_ok=True)
    manifest_modules = []
    for module in modules:
        path = modules_dir / f"{module['id']}.json"
        path.write_text(json.dumps(module, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        manifest_modules.append(
            {
                "id": module["id"],
                "title": module["title"],
                "titleId": module["titleId"],
                "description": module["description"],
                "persona": module["persona"],
                "status": module["status"],
                "itemCount": module["itemCount"],
            }
        )
    manifest = {"version": "1.0.0", "modules": manifest_modules}
    (HOME / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    speak_dir = HOME / "speak"
    speak_dir.mkdir(parents=True, exist_ok=True)
    packs_meta = []
    total_speak = 0
    for pack_id, title, title_id, rows in SPEAK_PACKS:
        items = [
            speak_item(pack_id, i, target, target_id, chunks)
            for i, (target, target_id, chunks) in enumerate(rows, 1)
        ]
        pack = {
            "id": pack_id,
            "title": title,
            "titleId": title_id,
            "itemCount": len(items),
            "items": items,
        }
        (speak_dir / f"{pack_id}.json").write_text(
            json.dumps(pack, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        packs_meta.append(
            {"id": pack_id, "title": title, "titleId": title_id, "itemCount": len(items)}
        )
        total_speak += len(items)
    speak_manifest = {"version": "1.0.0", "itemCount": total_speak, "packs": packs_meta}
    (speak_dir / "manifest.json").write_text(
        json.dumps(speak_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    drills = build_drills()
    build_dir = HOME / "build"
    build_dir.mkdir(parents=True, exist_ok=True)
    (build_dir / "drills.json").write_text(
        json.dumps(drills, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    module_items = sum(module["itemCount"] for module in modules)
    print(f"modules {len(modules)} items {module_items}")
    print(f"speak {total_speak}")
    print(f"drills {len(drills)}")


if __name__ == "__main__":
    main()
