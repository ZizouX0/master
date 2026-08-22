"""Plain-language subject labels: what a programme is actually about.

Path letters are a filing system, not an explanation, and "A" tells the reader
nothing. Two things fix that: the full path name in every cell, and a sentence
describing the real subject.

The subject sentence is DERIVED, never invented. It is built from cues in the
programme's own title plus the discipline its path denotes — so it says what
the degree is about, and it never claims a module or a syllabus detail that was
not read off an official page.
"""
import re

PATH_FULL = {
    "A":  "Sound & Music Computing",
    "C":  "AI / ML for Audio & Music",
    "N":  "Music-Tech Product & Innovation",
    "G":  "Sound Design (film / games / media)",
    "H":  "Immersive / Spatial Audio",
    "R":  "Live Sound & Event Systems",
    "J":  "Music Business & Management",
    "L":  "Music / Creative Entrepreneurship",
    "AC": "Marketing & Brand Management",
    "AD": "Media & Entertainment Management",
}

# what the discipline means in practice, in the client's terms
PATH_STUDY = {
    "A":  "signal processing, audio programming and music information retrieval — writing the software that makes and analyses sound",
    "C":  "machine learning and data science, with audio, speech or music as the application domain",
    "N":  "turning technology into products — prototyping, interaction design and venture building",
    "G":  "sound design and audio post-production for film, games and media",
    "H":  "spatial and immersive audio — ambisonics, binaural, object-based mixing, audio for XR",
    "R":  "live sound and event systems — PA and system design, show production, venue technology",
    "J":  "the music industry as a business — rights, labels, touring, streaming economics",
    "L":  "building your own venture or creative practice in the cultural sector",
    "AC": "marketing and brand management — consumer behaviour, analytics and campaigns",
    "AD": "running media and entertainment organisations — creative-industries strategy",
}

# Concrete cues from the programme's own title. ORDER MATTERS and is the whole
# trick: "Music Production, Technology, and Innovation" matched `innovation`
# first and came back described as innovation management, and a media-studies
# degree did the same. Modifier words that attach to anything — innovation,
# entrepreneurship, management, international — sit at the bottom; the specific
# subject nouns sit at the top.
CUES = [
 # -- unmistakable subject nouns -------------------------------------------
 (r"tonmeister",                       "Tonmeister: classical recording, balance engineering and studio craft at conservatoire level"),
 (r"sonolog",                          "Sonology: electronic music composition, synthesis and computer-music research"),
 (r"art sonor|sound art|klangkunst",   "Sound art: sonic installation and artistic practice rather than commercial production"),
 (r"live electronics",                 "Live electronics: real-time electronic performance and instrument building"),
 (r"acoustic|ac[uú]stic",              "Acoustic engineering: the physics of sound, measurement, room and environmental acoustics, transducers"),
 (r"audiokommunikation|audio communication",
                                       "Audio communication and technology: DSP, psychoacoustics, spatial audio and audio software"),
 (r"sound and music computing|tecnolog(ies|ias|ías) del so|tecnolog[ií]as? de la m[uú]sica",
                                       "Sound and music computing: DSP, machine listening, music information retrieval and audio software"),
 (r"immersive audio|spatial audio|audio inmersivo",
                                       "Immersive audio: ambisonics, binaural and object-based mixing for film, games and XR"),
 (r"music production|producci[oó]n (de )?m[uú]sic|music technolog|music design",
                                       "Music production and technology: studio craft, arrangement, sound design and production tools"),
 (r"postproduc|post-produc",           "Audio post-production: dialogue, foley, mixing and delivery for screen"),
 (r"sound design|dise[nñ]o de sonido|sound for|art of sound|music for film",
                                       "Sound design: designing and building the sound of film, games and media"),
 (r"game (audio|technology)|videojuego","Game audio and technology: interactive sound systems and real-time engines"),
 (r"veranstaltungstechnik|event technolog|sonorizaci|sonido directo",
                                       "Event and live-sound technology: PA and system design, rigging, staging and show systems"),
 (r"composici|composition|bandes sonores|bandas sonoras",
                                       "Composition: writing music, increasingly with technology as the instrument"),
 (r"musik|m[uú]sica|music studies|musicolog",
                                       "Music studies: musical practice and scholarship rather than engineering"),
 # -- computing and data ----------------------------------------------------
 (r"deep learning|aprendizaje profundo","Deep learning: neural architectures, training and applied machine learning"),
 (r"speech technolog|\bvoice\b",       "Speech technology: recognition, synthesis and spoken-language processing"),
 (r"artificial intelligence|inteligencia (artificial|computacional)",
                                       "Artificial intelligence: machine learning, reasoning and applied AI systems"),
 (r"data scien|ciencia de datos|datcom","Data science: statistics, machine learning and large-scale data engineering"),
 (r"telecom|telem[aá]tica|redes de",   "Telecommunications engineering: signals, networks and transmission — the signal-processing core transfers directly to audio"),
 (r"software",                         "Software engineering: architecture, development process and large-system design"),
 (r"inform[aá]tica|computer (science|engineering)|computaci[oó]n|l[oó]gica",
                                       "Computer science and engineering: advanced computing, systems and algorithms"),
 # -- design, media, culture -------------------------------------------------
 (r"human-computer interaction|interaction|interacci[oó]n|\bHCI\b",
                                       "Human-computer interaction: interface design, prototyping and user research"),
 (r"design (&|and) computation",       "Design and computation: computational and generative design practice"),
 (r"product design|integrated product|strategic product",
                                       "Product design: user-centred design, prototyping and bringing products to market"),
 (r"digital design|digital media|medieninformatik|media technolog|nuevos medios",
                                       "Media technology and digital design: building interactive products and new formats"),
 (r"film|cinema|cine\b|audiovisual",   "Film and audiovisual practice: production craft applied to picture and sound"),
 (r"creative industr|industrias creativas|kreativwirtschaft|cultural industr",
                                       "Creative industries: the economics and management of creative sectors"),
 (r"cultural (economics|management|leadership|policy)|gesti[oó]n cultural|kulturmanagement|arts and culture|cultura",
                                       "Cultural management and economics: how cultural organisations are financed and run"),
 (r"media (studies|management)|medienmanagement|comunicaci[oó]n|communication",
                                       "Media and communication: how media organisations, formats and audiences work"),
 # -- business, and the modifier words that attach to anything ---------------
 (r"music (business|management)|entertainment and music|gesti[oó]n.{0,24}m[uú]sic",
                                       "Music business: rights, labels, live, publishing and streaming economics"),
 (r"marketing|marqueting|m[aá]rketing", "Marketing: consumer behaviour, brand strategy, analytics and campaigns"),
 (r"entrepreneur|emprend",             "Entrepreneurship: venture creation, business models and funding"),
 (r"innovation|innovaci",              "Innovation management: how new technology becomes a product and a business"),
 (r"business administration|international management|leadership|empresarial|\bMBA\b",
                                       "General management: strategy, finance, organisation and operations"),
]

def subject_line(program_name, paths):
    """A sentence saying what this degree is about.

    The Path column already names the discipline, so this does not repeat it.
    A cue from the title wins; the path's own description is the fallback.
    """
    name = program_name or ""
    for pat, text in CUES:
        if re.search(pat, name, re.I):
            return text
    primary = paths[0] if paths else ""
    frame = PATH_STUDY.get(primary)
    return frame[0].upper() + frame[1:] if frame else "Subject not classified from the title"

def paths_full(paths):
    return " · ".join(PATH_FULL.get(p, p) for p in paths if p)
