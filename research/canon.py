"""Canonical keys for deduping programme rows.

Two agents describing the same programme rarely spell it the same way: one
writes "Universität der Künste Berlin (UdK...)", the other "Universitat der
Kunste Berlin (UdK...)"; one appends the faculty, the other doesn't. So the
institution key strips accents, parentheticals and any faculty/department tail,
then maps known aliases onto one spelling.

Programme names need the opposite care. "Marketing Management" and "Marketing
Analytics" at the same school are DIFFERENT degrees, and merging them would
invent a programme that does not exist. So a pair only merges when the core
names match closely AND neither carries a distinguishing token the other lacks.
"""
import re, unicodedata

def _ascii(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()

# tails that name a sub-unit rather than a different institution
_UNIT = re.compile(r"\b(facult|department|dept|school|institute|instituto|escola|escuela|"
                   r"campus|group|grup|centro|centre|center|college|academy|akademie|"
                   r"fachbereich|institut|zentralinstitut|career|graduate|laborator)", re.I)

_ALIAS = [
    (r"universitat pompeu fabra|upf barcelona school of management|\bupf\b", "upf"),
    (r"technische universitaet berlin|technische universitat berlin|\btu berlin\b", "tu berlin"),
    (r"universitaet der kuenste|universitat der kunste|\budk\b", "udk berlin"),
    (r"hku university of the arts|hogeschool voor de kunsten utrecht|\bhku\b", "hku utrecht"),
    (r"erasmus university rotterdam|\beshcc\b", "erasmus rotterdam"),
    (r"royal conservatoire the hague|koninklijk conservatorium|institute of sonology", "royal conservatoire the hague"),
    (r"conservatorium van amsterdam", "conservatorium van amsterdam"),
    (r"university of amsterdam|\buva\b", "university of amsterdam"),
    (r"universidad politecnica de madrid|\bupm\b", "upm"),
    (r"universitat politecnica de valencia|\bupv\b", "upv"),
    (r"universitat politecnica de catalunya|barcelonatech|\bupc\b", "upc"),
    (r"la salle campus barcelona|universitat ramon llull", "la salle url"),
    (r"catalyst.*creative arts and technology|dbs music berlin", "catalyst berlin"),
    (r"srh berlin|hochschule der popularen kunste|\bhdpk\b|berlin school of popular arts", "srh berlin"),
    (r"macromedia", "macromedia"),
    (r"bimm", "bimm berlin"),
    (r"sae institute amsterdam", "sae amsterdam"),
    (r"sae institute spain", "sae spain"),
    (r"sae institute germany", "sae germany"),
    (r"breda university of applied sciences|\bbuas\b", "breda uas"),
    (r"delft university of technology|\btu delft\b", "tu delft"),
    (r"leiden university", "leiden university"),
    (r"radboud university", "radboud university"),
    (r"utrecht university", "utrecht university"),
    (r"mondragon", "mondragon"),
    (r"enti-?ub|escola de noves tecnologies interactives", "enti ub"),
    (r"escola superior de musica de catalunya|\besmuc\b", "esmuc"),
    (r"universitat de barcelona\b", "universitat de barcelona"),
    (r"freie universitaet berlin|freie universitat berlin", "fu berlin"),
    (r"humboldt", "hu berlin"),
    (r"hochschule fur wirtschaft und recht|\bhwr\b", "hwr berlin"),
    (r"universidad autonoma de madrid|\buam\b", "uam"),
    (r"universidad carlos iii|\buc3m\b", "uc3m"),
    (r"microfusa", "microfusa"),
    (r"university of groningen|rijksuniversiteit groningen", "groningen"),
    (r"maastricht university", "maastricht"),
    (r"tilburg university", "tilburg"),
]

def inst_key(s):
    t = _ascii(s).lower()
    t = re.sub(r"\(.*?\)", " ", t)                      # drop parentheticals
    for sep in (" - ", " – ", " / ", ", "):             # drop a faculty/dept tail
        if sep in t:
            head, tail = t.split(sep, 1)
            if _UNIT.search(tail):
                t = head
    t = re.sub(r"[^a-z0-9]+", " ", t).strip()
    for pat, canon in _ALIAS:
        if re.search(pat, t):
            return canon
    return " ".join(t.split()[:5])

# words that never distinguish one programme from another
_NOISE = {"master","masters","msc","ma","mmus","meng","m","sc","a","of","in","en","de","del","la","el",
          "the","universitario","universitari","official","degree","programme","program","and","y","i",
          "science","sciences","arts","art","studies","study","track","specialisation","specialization",
          "pathway","strand","strands","focus","universiteit","full","time","fulltime"}

# words that DO distinguish — if one name has it and the other doesn't, keep them apart
_DISTINGUISH = {"analytics","management","film","music","games","game","sound","strategic","integrated",
                "international","executive","online","research","business","marketing","acustica","acoustics",
                "artificial","inteligencia","intelligence","postproduccion","postproduction","design",
                "entrepreneurship","economics","cultural","creative","media","immersive","sonology",
                "leadership","policy","innovation","crossover","composicio","bandes","produccio","vibrations",
                "part","deeltijd"}

def prog_tokens(s):
    t = _ascii(s).lower()
    t = re.sub(r"\(.*?\)", " ", t)                      # drop the translation gloss
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return {w for w in t.split() if w not in _NOISE and len(w) > 2}

def same_programme(a, b):
    ta, tb = prog_tokens(a), prog_tokens(b)
    if not ta or not tb:
        return False
    # a distinguishing word present on one side only means these are different degrees
    if (ta ^ tb) & _DISTINGUISH:
        return False
    return len(ta & tb) / min(len(ta), len(tb)) >= 0.7
