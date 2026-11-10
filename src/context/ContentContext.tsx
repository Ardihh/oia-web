'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface StatItem {
  id: string;
  value: string;
  suffix: string;
  label: { id: string; en: string };
  desc: { id: string; en: string };
}

export interface ServiceItem {
  id: string;
  title: { id: string; en: string };
  desc: { id: string; en: string };
  href: string;
}

export interface FaqItem {
  id: string;
  q: { id: string; en: string };
  a: { id: string; en: string };
}

export interface GuideItem {
  id: string;
  title: { id: string; en: string };
  category: { id: string; en: string };
  desc: { id: string; en: string };
  fileUrl: string;
  fileSize: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  category: { id: string; en: string };
  date: { id: string; en: string };
  title: { id: string; en: string };
  summary: { id: string; en: string };
  content?: { id: string; en: string };
  image: string;
  author?: string;
}

export interface SiteContent {
  hero: {
    badge: { id: string; en: string };
    titlePrefix: { id: string; en: string };
    titleHighlight: { id: string; en: string };
    subtitle: { id: string; en: string };
    ctaStudy: { id: string; en: string };
    ctaPartner: { id: string; en: string };
    trustPill: { id: string; en: string };
    bgImage: string;
  };
  about: {
    kicker: { id: string; en: string };
    title: { id: string; en: string };
    description1: { id: string; en: string };
    description2: { id: string; en: string };
    visionTitle: { id: string; en: string };
    visionDesc: { id: string; en: string };
    missionTitle: { id: string; en: string };
    missionItems: { id: string[]; en: string[] };
    messageTitle: { id: string; en: string };
    messageQuote: { id: string; en: string };
    messageAuthor: { id: string; en: string };
    messageRole: { id: string; en: string };
    messageOffice: { id: string; en: string };
    headPhoto: string;
  };
  stats: {
    kicker: { id: string; en: string };
    title: { id: string; en: string };
    subtitle: { id: string; en: string };
    items: StatItem[];
  };
  services: {
    kicker: { id: string; en: string };
    title: { id: string; en: string };
    subtitle: { id: string; en: string };
    items: ServiceItem[];
  };
  faq: {
    kicker: { id: string; en: string };
    title: { id: string; en: string };
    subtitle: { id: string; en: string };
    items: FaqItem[];
  };
  contact: {
    addressContent: { id: string; en: string };
    emailValue: string;
    phoneValue: string;
    hoursValue: { id: string; en: string };
    mapUrl: string;
  };
  guides: GuideItem[];
  news: NewsArticle[];
}

export const defaultGuides: GuideItem[] = [
  {
    id: 'guide-1',
    title: {
      id: 'Buku Panduan Mahasiswa Internasional UNRAM 2026/2027',
      en: 'UNRAM International Student Handbook 2026/2027',
    },
    category: {
      id: 'Penerimaan Mahasiswa Asing',
      en: 'International Admissions',
    },
    desc: {
      id: 'Panduan komprehensif tentang kurikulum, biaya kuliah, registrasi akademik, dan orientasi kehidupan kampus di Lombok.',
      en: 'Comprehensive guide covering academic curriculum, tuition structure, registration, and student life in Lombok.',
    },
    fileUrl: 'https://io.unram.ac.id/documents/international-student-handbook.pdf',
    fileSize: 'PDF • 4.2 MB',
    updatedAt: '10 Nov 2026',
  },
  {
    id: 'guide-2',
    title: {
      id: 'Pedoman Mobilitas Mahasiswa Keluar (IISMA & Exchange)',
      en: 'Outbound Student Mobility & IISMA Guidelines',
    },
    category: {
      id: 'Mobilitas Mahasiswa',
      en: 'Student Mobility',
    },
    desc: {
      id: 'Persyaratan berkas, format proposal esai, konversi SKS mata kuliah luar negeri, dan jadwal seleksi wawancara tingkat universitas.',
      en: 'Eligibility criteria, essay structures, credit transfer policies, and institutional interview timelines.',
    },
    fileUrl: 'https://io.unram.ac.id/documents/unram-outbound-mobility-guide.pdf',
    fileSize: 'PDF • 2.8 MB',
    updatedAt: '05 Nov 2026',
  },
  {
    id: 'guide-3',
    title: {
      id: 'Panduan Prosedur Visa Belajar (Study Permit) & e-ITAS',
      en: 'Study Permit & e-ITAS Visa Regulatory Procedure',
    },
    category: {
      id: 'Visa & Izin Tinggal',
      en: 'Visa & Stay Permits',
    },
    desc: {
      id: 'Alur permohonan izin belajar Kemendikbudristek, dokumen telex visa imigrasi, dan pelaporan berkala bagi mahasiswa & peneliti asing.',
      en: 'Step-by-step instructions for Ministry study permits, immigration clearance, and local police reporting for visiting scholars.',
    },
    fileUrl: 'https://io.unram.ac.id/documents/study-permit-itas-guidelines.pdf',
    fileSize: 'PDF • 1.9 MB',
    updatedAt: '28 Okt 2026',
  },
];

export const defaultNews: NewsArticle[] = [
  {
    id: '1',
    category: { id: 'Program Mobilitas', en: 'Mobility Program' },
    date: { id: '10 Nov 2026', en: '10 Nov 2026' },
    title: {
      id: 'Sosialisasi Seleksi IISMA UNRAM Menuju Universitas Top Dunia',
      en: 'UNRAM Hosts IISMA Information Session for Prestigious Overseas Universities',
    },
    summary: {
      id: 'Ratusan mahasiswa UNRAM antusias mengikuti pembekalan esai, wawancara, dan tes kecakapan bahasa Inggris bersama alumni program.',
      en: 'Hundreds of UNRAM undergraduates attended comprehensive essay-writing, interview coaching, and language certification workshops with program alumni.',
    },
    content: {
      id: 'Kantor Urusan Internasional (KUI) Universitas Mataram secara resmi menyelenggarakan sesi sosialisasi intensif program Indonesian International Student Mobility Awards (IISMA) 2026. Acara yang dihadiri lebih dari 350 mahasiswa dari berbagai fakultas ini berfokus pada strategi penulisan esai motivasi, simulasi wawancara bahasa Inggris, serta tata cara pemilihan universitas mitra terkemuka di kawasan Eropa, Amerika, dan Asia.\n\nDalam sambutannya, Wakil Rektor Bidang Kerja Sama dan Internasionalisasi UNRAM menegaskan komitmen universitas dalam memfasilitasi mahasiswa dengan pelatihan TOEFL/IELTS intensif serta pendampingan administrasi penuh. Sejumlah alumni IISMA tahun sebelumnya turut berbagi tips praktis mengenai adaptasi budaya dan keberhasilan studi di kampus tujuan.',
      en: 'The International Affairs Office (IAO) of Universitas Mataram officially hosted a comprehensive briefing session for the Indonesian International Student Mobility Awards (IISMA) 2026. Attended by over 350 undergraduates across diverse faculties, the session spotlighted strategic essay formulating, English interview simulations, and tailored university selection across top-tier partner institutions in Europe, the Americas, and Asia.\n\nIn his opening keynote, UNRAM\'s Vice Rector for Cooperation and Global Affairs emphasized institutional commitments to provide subsidized language certifications and seamless credit transfer frameworks. Awardees from preceding cohorts shared firsthand reflections on cross-cultural adaptation and academic excellence abroad.',
    },
    image: '/images/news-1.jpg',
    author: 'Tim Humas & Media KUI UNRAM',
  },
  {
    id: '2',
    category: { id: 'Kemitraan Global', en: 'Global Partnership' },
    date: { id: '04 Nov 2026', en: '04 Nov 2026' },
    title: {
      id: 'Penandatanganan Nota Kesepahaman Riset Bersama Konsorsium Internasional',
      en: 'Signing of Joint Marine & Environmental Research MoU with International Consortium',
    },
    summary: {
      id: 'UNRAM memperluas kolaborasi riset kelautan dan keanekaragaman hayati Lombok bersama perwakilan universitas mitra asing.',
      en: 'UNRAM deepens collaborative research in marine conservation and tropical ecology with partner delegates from abroad.',
    },
    content: {
      id: 'Universitas Mataram menandatangani Nota Kesepahaman (MoU) dan Perjanjian Kerja Sama Riset (MoA) dengan konsorsium universitas riset internasional terkemuka di bidang biologi kelautan dan kelestarian ekosistem terumbu karang.\n\nKolaborasi ini mencakup pendanaan hibah penelitian bersama, pertukaran profesor tamu, serta pemanfaatan stasiun laboratorium laut tropis UNRAM di pesisir Pulau Lombok. Inisiatif strategis ini diharapkan mempercepat hilirisasi publikasi saintifik internasional bereputasi dan memberikan solusi nyata bagi mitigasi perubahan iklim di wilayah pesisir Nusa Tenggara Barat.',
      en: 'Universitas Mataram ratified a comprehensive Memorandum of Understanding (MoU) and research implementation agreement with an international consortium specializing in marine biotechnology and coral reef preservation.\n\nThe multilateral initiative unlocks collaborative research grants, reciprocal faculty fellowships, and field deployments at UNRAM\'s tropical marine research station in coastal Lombok. This strategic partnership directly bolsters high-impact global publications and community-driven climate resilience models across the Indonesian archipelago.',
    },
    image: '/images/news-2.jpg',
    author: 'Subbagian Kerja Sama Luar Negeri',
  },
  {
    id: '3',
    category: { id: 'Inbound Students', en: 'Inbound Students' },
    date: { id: '28 Okt 2026', en: '28 Oct 2026' },
    title: {
      id: 'Penyambutan Mahasiswa Asing Program Indonesian Culture & Language',
      en: 'Welcoming Orientation for International Students of Indonesian Language & Culture Program',
    },
    summary: {
      id: 'KUI UNRAM menggelar sesi orientasi budaya, tata tertib kampus, serta kelas adaptasi bagi mahasiswa asing semester ini.',
      en: 'IAO UNRAM delivered campus orientation, cultural adaptation briefings, and student welfare support for incoming international fellows.',
    },
    content: {
      id: 'KUI Universitas Mataram menyambut hangat rombongan mahasiswa internasional baru dari berbagai negara seperti Jerman, Jepang, Korea Selatan, dan Timor Leste yang mengikuti program semesteran Bahasa Indonesia bagi Penutur Asing (BIPA) dan Studi Budaya Sasak.\n\nOrientasi mencakup pengenalan sistem akademik digital SIAKAD, tata tertib kampus, panduan keselamatan lingkungan, serta pendampingan langsung oleh rekan mahasiswa UNRAM (Student Buddies) untuk membantu adaptasi di lingkungan masyarakat Mataram.',
      en: 'IAO Universitas Mataram warmly welcomed incoming international students from Germany, Japan, South Korea, and Timor-Leste enrolled in the Indonesian Language for Foreign Speakers (BIPA) and Sasak Cultural Studies programs.\n\nThe onboarding program delivered comprehensive walkthroughs of campus academic portals, immigration protocol, student welfare amenities, and paired international candidates with local UNRAM Student Buddies to facilitate seamless cultural integration.',
    },
    image: '/images/news-3.jpg',
    author: 'Divisi Layanan Mahasiswa Asing KUI',
  },
];

export const defaultSiteContent: SiteContent = {
  hero: {
    badge: {
      id: 'Pintu Gerbang Internasionalisasi UNRAM',
      en: "UNRAM's Gateway to the World",
    },
    titlePrefix: {
      id: 'Membuka Peluang Dunia dari',
      en: 'Unlocking Global Horizons from',
    },
    titleHighlight: {
      id: 'Lombok untuk Masa Depan Global',
      en: 'Lombok for an Interconnected Future',
    },
    subtitle: {
      id: 'KUI Universitas Mataram memfasilitasi pertukaran mahasiswa, kolaborasi riset internasional, dan kemitraan akademik lintas benua di jantung Nusa Tenggara Barat.',
      en: 'The International Affairs Office of Universitas Mataram connects students, faculty, and research consortia across continents from the tropical heart of West Nusa Tenggara.',
    },
    ctaStudy: {
      id: 'Kuliah di UNRAM',
      en: 'Study at UNRAM',
    },
    ctaPartner: {
      id: 'Kemitraan Institusi',
      en: 'Partner With Us',
    },
    trustPill: {
      id: 'TODO: replace (00+ Mitra Universitas Dunia • Akreditasi Unggul)',
      en: 'TODO: replace (00+ Global Partner Universities • Premier Accreditation)',
    },
    bgImage: '/images/hero-campus.jpg',
  },
  about: {
    kicker: { id: 'Tentang Kami', en: 'About Us' },
    title: {
      id: 'Menghubungkan Universitas Mataram dengan Komunitas Akademik Global',
      en: 'Connecting Universitas Mataram with the Global Academic Community',
    },
    description1: {
      id: 'Kantor Urusan Internasional (KUI) adalah unit kerja pelaksana di bawah Rektorat Universitas Mataram yang bertanggung jawab menginisiasi, mengembangkan, serta mengelola kerja sama akademik dan mobilitas internasional.',
      en: 'The International Affairs Office (IAO) is the executive bureau under the Rectorate of Universitas Mataram entrusted with fostering, expanding, and overseeing international academic partnerships and cross-border mobility.',
    },
    description2: {
      id: 'Kami bertekad menjadikan UNRAM sebagai episentrum pendidikan tinggi berdaya saing global berbasis riset kepulauan dan kearifan lokal Nusa Tenggara Barat.',
      en: 'We are committed to establishing UNRAM as an archipelago-focused international research hub that champions local wisdom and sustainable tropical development.',
    },
    visionTitle: { id: 'Visi Internasional', en: 'Our Vision' },
    visionDesc: {
      id: 'Menjadi universitas berdaya saing global yang terkemuka dalam riset berbasis kepulauan dan inovasi berkelanjutan.',
      en: 'To be a globally competitive university eminent in island-based scientific innovation and sustainable development.',
    },
    missionTitle: { id: 'Misi Strategis', en: 'Our Mission' },
    missionItems: {
      id: [
        'Memperluas jejaring kemitraan dengan universitas dan lembaga riset bereputasi di seluruh benua.',
        'Meningkatkan partisipasi mahasiswa dan dosen UNRAM dalam program mobilitas, pertukaran, dan konferensi global.',
        'Memberikan layanan prima perizinan, imigrasi, dan pendampingan bagi mahasiswa serta peneliti internasional.',
        'Mendorong penyelenggaraan program studi bertaraf internasional dan riset kolaboratif lintas disiplin.',
      ],
      en: [
        'Broaden strategic academic consortia and research alliances across continents.',
        'Empower UNRAM faculty and students through outbound exchange, fellowships, and conferences.',
        'Deliver hospitality, legal study permits, and cultural concierge for incoming international scholars.',
        'Catalyze international curriculum accreditations and interdisciplinary collaborative research.',
      ],
    },
    messageTitle: { id: 'Pesan Kepala Kantor', en: 'Message from the Head of Office' },
    messageQuote: {
      id: 'Pintu gerbang kami senantiasa terbuka lebar bagi mahasiswa dan mitra dari seluruh penjuru dunia untuk berkarya dan bertumbuh bersama di Lombok.',
      en: 'Our gateway is widely open to global scholars, students, and research consortia wishing to collaborate and innovate in Lombok.',
    },
    messageAuthor: {
      id: 'TODO: replace (Nama Kepala Kantor, Ph.D.)',
      en: 'TODO: replace (Head of Office Name, Ph.D.)',
    },
    messageRole: {
      id: 'Kepala Kantor Urusan Internasional',
      en: 'Head of International Affairs Office',
    },
    messageOffice: {
      id: 'Universitas Mataram',
      en: 'Universitas Mataram',
    },
    headPhoto: '/images/head-of-office.jpg',
  },
  stats: {
    kicker: { id: 'Capaian & Dampak', en: 'Global Footprint' },
    title: { id: 'Jejaring Internasional dalam Angka', en: 'International Impact in Numbers' },
    subtitle: {
      id: 'Komitmen nyata Universitas Mataram dalam membangun kolaborasi akademik terukur dan berkelanjutan.',
      en: 'Verifiable metrics driving UNRAM\'s sustained globalization and bilateral institutional engagements.',
    },
    items: [
      {
        id: 'partners',
        value: '45',
        suffix: '+',
        label: { id: 'Mitra Universitas Global', en: 'Global Partner Universities' },
        desc: { id: 'MoU & MoA aktif lintas 5 benua', en: 'Active MoUs across 5 continents' },
      },
      {
        id: 'countries',
        value: '18',
        suffix: '',
        label: { id: 'Negara Asal Kolaborasi', en: 'Countries Represented' },
        desc: { id: 'Asia, Eropa, Australia, & Amerika', en: 'Asia, Europe, Australia, & Americas' },
      },
      {
        id: 'students',
        value: '120',
        suffix: '+',
        label: { id: 'Mahasiswa Mobilitas / Tahun', en: 'Annual Mobility Scholars' },
        desc: { id: 'Program Inbound & Outbound (IISMA)', en: 'Inbound & Outbound cohorts' },
      },
      {
        id: 'programs',
        value: '14',
        suffix: '',
        label: { id: 'Program Internasional Aktif', en: 'Active Global Programs' },
        desc: { id: 'Gelar ganda, riset bersama, & BIPA', en: 'Joint research, BIPA, & dual degrees' },
      },
    ],
  },
  services: {
    kicker: { id: 'Layanan Kami', en: 'Our Services' },
    title: { id: 'Dukungan Komprehensif Mobilitas & Kemitraan', en: 'End-to-End International Support' },
    subtitle: {
      id: 'Fasilitas dan pendampingan menyeluruh bagi mahasiswa, dosen, serta calon institusi mitra internasional.',
      en: 'Dedicated administrative and concierge services tailored for international candidates, faculty, and institutional partners.',
    },
    items: [
      {
        id: 'inbound',
        title: { id: 'Mahasiswa Asing (Inbound)', en: 'Inbound International Students' },
        desc: {
          id: 'Penerimaan sarjana/pascasarjana, program non-gelar, kursus Bahasa Indonesia (BIPA), dan magang riset.',
          en: 'Full-degree admissions, short-term non-degree programs, BIPA language immersion, and research internships.',
        },
        href: '#admission',
      },
      {
        id: 'outbound',
        title: { id: 'Mobilitas Keluar (Outbound)', en: 'Outbound Mobility' },
        desc: {
          id: 'Fasilitasi program IISMA, pertukaran pelajar semesteran, konferensi pemuda global, dan magang luar negeri untuk mahasiswa UNRAM.',
          en: 'Endorsement and coaching for Indonesian International Student Mobility Awards (IISMA), overseas internships, and semester exchange.',
        },
        href: '#contact',
      },
      {
        id: 'partnerships',
        title: { id: 'Kemitraan & MoU', en: 'Partnerships & MoUs' },
        desc: {
          id: 'Inisiasi, perumusan, legalitas, serta evaluasi naskah kerja sama (MoU/MoA) dengan universitas dan lembaga mitra terkemuka dunia.',
          en: 'Initiation, legal drafting, ratification, and implementation monitoring for bilateral MoUs and MoAs with international universities.',
        },
        href: '#contact',
      },
      {
        id: 'scholarships',
        title: { id: 'Informasi Beasiswa', en: 'Scholarship Guidance' },
        desc: {
          id: 'Pusat informasi beasiswa mobilitas global (Erasmus+, MEXT, KNB, Fulbright, LPDP) dan pelatihan persiapan seleksi berkas.',
          en: 'Resource hub for worldwide scholarship opportunities (Erasmus+, MEXT, KNB Indonesia, Fulbright, LPDP) and application clinics.',
        },
        href: '#contact',
      },
      {
        id: 'scholars',
        title: { id: 'Visiting Scholar & Peneliti', en: 'Visiting Scholars & Researchers' },
        desc: {
          id: 'Penyambutan dan administrasi profesor tamu, peneliti internasional, serta kolaborasi riset saintifik di laboratorium UNRAM.',
          en: 'Administrative concierge, laboratory access coordination, and guest lecture management for visiting international faculty.',
        },
        href: '#contact',
      },
      {
        id: 'visa',
        title: { id: 'Layanan Izin Tinggal & Visa', en: 'Visa & Stay Permit Assistance' },
        desc: {
          id: 'Bantuan rekomendasi izin belajar (Study Permit Kemendikbudristek), visa tinggal terbatas (KITAS/e-ITAS), dan lapor kepolisian/imigrasi.',
          en: 'Formal support for study permits via the Ministry of Education, limited stay visas (e-ITAS/KITAS), and local immigration reporting.',
        },
        href: '#contact',
      },
    ],
  },
  faq: {
    kicker: { id: 'Tanya Jawab', en: 'Frequently Asked Questions' },
    title: { id: 'Pertanyaan yang Sering Diajukan', en: 'Everything You Need to Know' },
    subtitle: {
      id: 'Jawaban lengkap atas pertanyaan umum seputar studi internasional, beasiswa, dan prosedur tinggal di Lombok.',
      en: 'Direct answers to key inquiries regarding international admission, visa regulations, and student life in Lombok.',
    },
    items: [
      {
        id: '1',
        q: {
          id: 'Apakah Universitas Mataram menyediakan beasiswa untuk mahasiswa internasional?',
          en: 'Does Universitas Mataram offer scholarships for international students?',
        },
        a: {
          id: 'Ya, mahasiswa internasional dapat mendaftar melalui beasiswa Kemitraan Negara Berkembang (KNB) dari Pemerintah Indonesia, beasiswa bilateral, atau program bebas biaya kuliah parsial dari UNRAM sesuai kualifikasi akademik.',
          en: 'Yes, international students may apply through the Indonesian Government\'s Developing Countries Partnership (KNB) Scholarship, bilateral governmental grants, or selective UNRAM tuition waiver programs based on academic excellence.',
        },
      },
      {
        id: '2',
        q: {
          id: 'Bagaimana prosedur permohonan visa dan izin tinggal bagi mahasiswa asing?',
          en: 'What is the procedure for obtaining a student visa and stay permit?',
        },
        a: {
          id: 'Setelah diterima resmi, KUI UNRAM akan mengurus Rekomendasi Izin Belajar ke Kementerian. Selanjutnya, tim kami memandu proses permohonan e-Visa tinggal terbatas hingga kedatangan di Bandara Internasional Lombok.',
          en: 'Once admitted, IAO UNRAM assists in obtaining the mandatory Study Permit from the Ministry of Higher Education. We then guide you through the electronic limited-stay visa (e-ITAS) process prior to landing at Lombok International Airport.',
        },
      },
      {
        id: '3',
        q: {
          id: 'Apakah tersedia akomodasi atau asrama mahasiswa di sekitar kampus UNRAM?',
          en: 'Is on-campus or student accommodation provided near the university?',
        },
        a: {
          id: 'UNRAM menyediakan Asrama Mahasiswa (Rusunawa) di dalam area kampus dan staf KUI siap mendampingi pencarian tempat tinggal alternatif seperti kos atau homestay yang aman dan terjangkau di sekitar Kota Mataram.',
          en: 'UNRAM provides campus dormitories (Rusunawa), and our office helps international students find verified, budget-friendly off-campus private rooms and homestays within safe walking distance.',
        },
      },
      {
        id: '4',
        q: {
          id: 'Bagaimana mahasiswa UNRAM dapat mendaftar program pertukaran ke luar negeri (IISMA / Outbound)?',
          en: 'How can UNRAM domestic students apply for outbound exchange programs like IISMA?',
        },
        a: {
          id: 'Mahasiswa aktif UNRAM dapat memantau info seleksi di situs KUI, mengikuti workshop pembekalan, dan mengajukan rekomendasi resmi universitas ke kantor kami sebelum batas tenggat program nasional.',
          en: 'Enrolled UNRAM students can access eligibility guidelines on our portal, participate in preparation workshops, and request official institutional nomination letters from IAO UNRAM ahead of national deadlines.',
        },
      },
      {
        id: '5',
        q: {
          id: 'Bahasa apa yang digunakan dalam proses perkuliahan untuk mahasiswa internasional?',
          en: 'What is the primary language of instruction for international students?',
        },
        a: {
          id: 'Tersedia kelas internasional berbahasa pengantar Inggris untuk program studi tertentu. Bagi program reguler, UNRAM menyediakan kursus Bahasa Indonesia bagi Penutur Asing (BIPA) secara intensif.',
          en: 'Select degree programs offer English-taught courses. For regular Indonesian-language tracks, UNRAM delivers intensive Indonesian Language for Foreign Speakers (BIPA) preparatory classes.',
        },
      },
      {
        id: '6',
        q: {
          id: 'Bagaimana institusi luar negeri dapat menginisiasi penandatanganan MoU dengan UNRAM?',
          en: 'How can an overseas university or research body initiate an MoU with UNRAM?',
        },
        a: {
          id: 'Perwakilan institusi dapat mengirimkan draf proposal kerja sama dan surat pengantar melalui formulir kontak kami atau via email resmi KUI di io@unram.ac.id untuk ditindaklanjuti bagian hukum dan kerja sama.',
          en: 'Prospective institutions can submit a formal letter of intent and draft agreement via our contact form or directly to io@unram.ac.id for review by our Rectorate and Legal Partnerships bureau.',
        },
      },
    ],
  },
  contact: {
    addressContent: {
      id: 'Gedung Rektorat UNRAM Lantai 1, Jl. Majapahit No. 62, Mataram, Nusa Tenggara Barat 83125, Indonesia',
      en: 'UNRAM Rectorate Building, 1st Floor, Jl. Majapahit No. 62, Mataram, West Nusa Tenggara 83125, Indonesia',
    },
    emailValue: 'io@unram.ac.id',
    phoneValue: '+62 (370) 633007',
    hoursValue: {
      id: 'Senin - Jumat: 08.00 - 16.00 WITA (GMT+8)',
      en: 'Monday – Friday: 08:00 – 16:00 WITA (GMT+8)',
    },
    mapUrl: 'https://maps.google.com/maps?q=Universitas%20Mataram%20Jl.%20Majapahit%20No.62&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  guides: defaultGuides,
  news: defaultNews,
};

interface ContentContextType {
  content: SiteContent;
  updateContent: (newContent: SiteContent) => void;
  resetContent: () => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function isSiteContentValid(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.stats?.items)) return false;
  if (!Array.isArray(data.services?.items)) return false;
  if (!Array.isArray(data.faq?.items)) return false;
  if (!Array.isArray(data.about?.missionItems?.id)) return false;
  if (!Array.isArray(data.about?.missionItems?.en)) return false;
  return true;
}

const STORAGE_KEY = 'unram_site_content_v4';

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  useEffect(() => {
    try {
      // Clear obsolete keys
      localStorage.removeItem('unram_site_content');
      localStorage.removeItem('unram_site_content_v2');

      // Check custom news in localStorage to preserve user articles
      let preservedNews: NewsArticle[] = defaultNews;
      const customNewsRaw = localStorage.getItem('unram_custom_news');
      if (customNewsRaw) {
        try {
          const parsedCustom = JSON.parse(customNewsRaw);
          if (Array.isArray(parsedCustom) && parsedCustom.length > 0) {
            preservedNews = parsedCustom;
          }
        } catch (e) {
          console.error(e);
        }
      }

      const savedV4 = localStorage.getItem(STORAGE_KEY);
      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        if (isSiteContentValid(parsed)) {
          // Merge guides and news if not present
          const merged: SiteContent = {
            ...defaultSiteContent,
            ...parsed,
            guides: Array.isArray(parsed.guides) && parsed.guides.length > 0 ? parsed.guides : defaultGuides,
            news: Array.isArray(parsed.news) && parsed.news.length > 0 ? parsed.news : preservedNews,
          };
          setContent(merged);
          return;
        }
      }

      // Default fallback with preserved news
      const initial: SiteContent = {
        ...defaultSiteContent,
        news: preservedNews,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setContent(initial);
    } catch (e) {
      console.error('Error initializing site content:', e);
      setContent(defaultSiteContent);
    }
  }, []);

  const updateContent = (newContent: SiteContent) => {
    setContent(newContent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
      if (Array.isArray(newContent.news)) {
        localStorage.setItem('unram_custom_news', JSON.stringify(newContent.news));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unram_content_changed'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetContent = () => {
    setContent(defaultSiteContent);
    try {
      localStorage.removeItem('unram_site_content');
      localStorage.removeItem('unram_site_content_v2');
      localStorage.removeItem('unram_site_content_v3');
      localStorage.setItem('unram_custom_news', JSON.stringify(defaultNews));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSiteContent));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unram_content_changed'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, resetContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(ContentContext);
  if (!context) {
    return {
      content: defaultSiteContent,
      updateContent: () => {},
      resetContent: () => {},
    };
  }
  return context;
}
