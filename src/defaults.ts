import type { Category, Settings } from './types'

const sub = (id: string, name: string, keywords: string[] = []) => ({ id, name, keywords })

export const DEFAULT_CATEGORIES: Category[] = [
  // ───────────── NECESSITÀ ─────────────
  {
    id: 'alimentari', name: 'Alimentari', icon: '🛒', group: 'necessita', budgetPct: 30,
    subs: [
      sub('supermercato', 'Supermercato', [
        'conad', 'lidl', 'coop', 'esselunga', 'eurospin', 'aldi', 'md discount', 'md ', 'penny', 'carrefour',
        'pam', 'despar', 'spar', 'interspar', 'eurospar', 'famila', 'iper', 'ipercoop', 'bennet', 'tigre', 'sigma',
        'crai', 'todis', 'in s', 'ins mercato', 'tuodi', 'deco', 'decò', 'simply', 'unes', 'il gigante', 'tosano',
        'supermercato', 'spesa', 'alimentari', 'market', 'minimarket', 'discount', 'frutta', 'verdura',
        'macelleria', 'panificio', 'pane', 'latte', 'uova', 'pasta', 'mercato', 'fruttivendolo', 'salumeria',
        'acqua', 'pescheria',
      ]),
    ],
  },
  {
    id: 'trasporti', name: 'Trasporti', icon: '⛽', group: 'necessita', budgetPct: 35,
    subs: [
      sub('carburante', 'Carburante', [
        'benzina', 'diesel', 'gasolio', 'carburante', 'rifornimento', 'pieno', 'eni', 'enilive', 'q8', 'ip ',
        'tamoil', 'esso', 'shell', 'api ', 'agip', 'distributore', 'gpl', 'metano', 'self',
      ]),
      sub('parcheggi', 'Parcheggi e pedaggi', ['parcheggio', 'pedaggio', 'autostrada', 'telepass', 'easypark', 'strisce blu', 'ztl', 'casello']),
      sub('mezzi', 'Mezzi pubblici', ['treno', 'trenitalia', 'italo', 'bus', 'autobus', 'metro', 'tram', 'biglietto', 'abbonamento bus', 'taxi', 'uber', 'flixbus']),
      sub('lavaggio', 'Lavaggio auto', ['lavaggio', 'autolavaggio']),
    ],
  },
  {
    id: 'fondo-auto', name: 'Fondo auto', icon: '🚗', group: 'necessita', budgetPct: 25, fund: true,
    subs: [
      sub('assicurazione', 'Assicurazione', ['assicurazione', 'rca', 'polizza', 'unipol', 'generali', 'allianz', 'prima assicurazioni', 'linear', 'genertel', 'verti', 'zurich']),
      sub('bollo', 'Bollo', ['bollo']),
      sub('revisione', 'Revisione', ['revisione']),
      sub('manutenzione', 'Manutenzione e tagliandi', [
        'tagliando', 'meccanico', 'officina', 'gomme', 'pneumatici', 'gommista', 'olio motore', 'cambio olio',
        'freni', 'pastiglie', 'batteria auto', 'carrozziere', 'carrozzeria', 'ricambi', 'filtro', 'cinghia', 'frizione',
      ]),
    ],
  },
  {
    id: 'salute', name: 'Salute', icon: '💊', group: 'necessita', budgetPct: 6,
    subs: [
      sub('farmacia', 'Farmacia', ['farmacia', 'farmaco', 'medicina', 'medicinale', 'tachipirina', 'oki', 'moment', 'parafarmacia', 'cerotti']),
      sub('visite', 'Visite mediche', ['visita', 'medico', 'dentista', 'ticket', 'oculista', 'analisi', 'esami', 'fisioterapia', 'fisioterapista', 'dermatologo', 'ospedale', 'specialista']),
    ],
  },
  {
    id: 'telefono', name: 'Telefono', icon: '📱', group: 'necessita', budgetPct: 4,
    subs: [
      sub('ricarica', 'Ricarica / abbonamento', ['ricarica telefonica', 'ricarica tim', 'ricarica vodafone', 'tim', 'vodafone', 'windtre', 'wind', 'iliad', 'ho mobile', 'ho.', 'kena', 'very mobile', 'fastweb', 'postemobile', 'coopvoce', 'sim', 'offerta telefonica']),
    ],
  },

  // ───────────── PERSONALE ─────────────
  {
    id: 'ristoranti', name: 'Ristoranti & Fast food', icon: '🍔', group: 'personale', budgetPct: 28,
    subs: [
      sub('fastfood', 'Fast food', [
        'mcdonald', 'mc donald', 'mcdonalds', 'mac donald', 'mc ', 'burger king', 'bk ', 'kfc', 'old wild west',
        'roadhouse', "o'tacos", 'otacos', 'o tacos', 'montacos', 'tacos', 'kebab', 'kebap', 'doner', 'piadina',
        'burger', 'hamburger', 'panino', 'panini', 'subway', 'poke', 'five guys', 'alice pizza', 'cheesburger',
        'cheeseburger', 'patatine', 'nuggets', 'wrap', 'hot dog', 'fritto',
      ]),
      sub('ristorante', 'Ristorante & Pizzeria', [
        'ristorante', 'pizzeria', 'pizza', 'sushi', 'giapponese', 'cinese', 'indiano', 'messicano', 'trattoria',
        'osteria', 'all you can eat', 'ayce', 'cena', 'pranzo fuori', 'braceria', 'steakhouse', 'agriturismo',
        'ramen', 'thai', 'hamburgeria',
      ]),
      sub('delivery', 'Delivery', ['just eat', 'justeat', 'deliveroo', 'glovo', 'uber eats', 'ubereats', 'delivery', 'domicilio']),
    ],
  },
  {
    id: 'bar', name: 'Bar & Snack', icon: '☕', group: 'personale', budgetPct: 8,
    subs: [
      sub('caffe', 'Bar & Caffè', ['caffe', 'caffè', 'cappuccino', 'cornetto', 'brioche', 'colazione', 'bar ', 'aperitivo', 'spritz', 'birra', 'cocktail', 'pub', 'gelato', 'gelateria', 'pasticceria', 'starbucks']),
      sub('distributori', 'Distributori & Snack', [
        'macchinetta', 'distributore automatico', 'vending', 'coca', 'coca cola', 'cocacola', 'coca zero', 'pepsi',
        'fanta', 'sprite', 'red bull', 'redbull', 'monster', 'energy drink', 'snack', 'merendina', 'patatine',
        'cioccolato', 'kinder', 'bibita', 'lattina', 'chips', 'matipay', 'coffee cap', 'coffeecap', 'pay4vend', 'selecta',
      ]),
    ],
  },
  {
    id: 'fitness', name: 'Fitness & Sport', icon: '🏋️', group: 'personale', budgetPct: 15,
    subs: [
      sub('palestra', 'Palestra', ['palestra', 'abbonamento palestra', 'mcfit', 'mc fit', 'virgin active', 'anytime fitness', 'fit express', 'personal trainer', 'crossfit', 'piscina', 'corso']),
      sub('attrezzatura', 'Attrezzatura', ['tapis roulant', 'tapirulan', 'tapisroulant', 'manubri', 'pesi', 'bilanciere', 'kettlebell', 'panca', 'cyclette', 'tappetino', 'elastici', 'decathlon', 'attrezzatura']),
      sub('integratori', 'Integratori', ['integratori', 'integratore', 'proteine', 'whey', 'creatina', 'myprotein', 'prozis', 'barretta proteica', 'amminoacidi', 'bcaa', 'multivitaminico']),
      sub('abbigliamento-sport', 'Abbigliamento sportivo', ['scarpe running', 'abbigliamento sportivo', 'tuta', 'leggings', 'canotta']),
    ],
  },
  {
    id: 'abbigliamento', name: 'Abbigliamento & Scarpe', icon: '👕', group: 'personale', budgetPct: 10,
    subs: [
      sub('vestiti', 'Vestiti', ['zara', 'h&m', 'hm ', 'pull&bear', 'pull and bear', 'bershka', 'primark', 'ovs', 'jack&jones', 'jack and jones', 'maglietta', 'maglia', 'felpa', 'jeans', 'pantaloni', 'giacca', 'giubbotto', 'camicia', 'vestiti', 'shein', 'zalando', 'calzini', 'boxer', 'intimo']),
      sub('scarpe', 'Scarpe', ['scarpe', 'sneakers', 'nike', 'adidas', 'new balance', 'puma', 'foot locker', 'footlocker', 'snipes', 'aw lab', 'ciabatte']),
      sub('accessori', 'Accessori', ['cappello', 'occhiali', 'orologio', 'zaino', 'borsa', 'portafoglio', 'cintura', 'collana', 'bracciale']),
    ],
  },
  {
    id: 'tecnologia', name: 'Tecnologia', icon: '🎮', group: 'personale', budgetPct: 6,
    subs: [
      sub('elettronica', 'Elettronica', ['iphone', 'samsung', 'smartphone', 'cuffie', 'airpods', 'cavo', 'caricatore', 'cover', 'pc', 'computer', 'tablet', 'ipad', 'monitor', 'mouse', 'tastiera', 'mediaworld', 'unieuro', 'euronics', 'apple', 'amazon', 'powerbank', 'smartwatch']),
      sub('videogiochi', 'Videogiochi', ['playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'videogioco', 'gioco', 'steam', 'fortnite', 'v-bucks', 'fifa', 'ea fc', 'gamestop', 'psn']),
    ],
  },
  {
    id: 'svago', name: 'Svago & Uscite', icon: '🎉', group: 'personale', budgetPct: 13,
    subs: [
      sub('uscite', 'Uscite & Serate', ['discoteca', 'serata', 'locale', 'festa', 'ingresso', 'compleanno', 'bowling', 'sala giochi', 'karaoke', 'tabacchi', 'sigarette', 'svapo', 'gratta e vinci', 'scommessa']),
      sub('eventi', 'Cinema & Eventi', ['cinema', 'film', 'concerto', 'teatro', 'stadio', 'partita', 'museo', 'mostra', 'evento', 'ticketone', 'biglietto concerto', 'uci', 'the space']),
      sub('hobby', 'Hobby & Libri', ['libro', 'libri', 'feltrinelli', 'mondadori', 'fumetto', 'manga', 'hobby']),
    ],
  },
  {
    id: 'abbonamenti', name: 'Abbonamenti digitali', icon: '📺', group: 'personale', budgetPct: 6,
    subs: [
      sub('streaming', 'Streaming & App', ['netflix', 'spotify', 'disney', 'prime video', 'amazon prime', 'dazn', 'now tv', 'sky', 'youtube premium', 'apple music', 'icloud', 'google one', 'playstation plus', 'ps plus', 'game pass', 'chatgpt', 'claude', 'abbonamento app', 'crunchyroll', 'paramount']),
    ],
  },
  {
    id: 'cura', name: 'Cura personale', icon: '💈', group: 'personale', budgetPct: 5,
    subs: [
      sub('barbiere', 'Barbiere', ['barbiere', 'parrucchiere', 'taglio', 'capelli', 'barba']),
      sub('prodotti', 'Prodotti & Profumi', ['profumo', 'deodorante', 'shampoo', 'balsamo', 'crema', 'rasoio', 'lamette', 'dopobarba', 'cera', 'gel', 'sephora', 'douglas', 'acqua e sapone', 'tigota', 'tigotà', 'bagnoschiuma', 'dentifricio', 'spazzolino']),
    ],
  },
  {
    id: 'viaggi', name: 'Viaggi', icon: '✈️', group: 'personale', budgetPct: 4,
    subs: [
      sub('viaggi', 'Viaggi & Vacanze', ['volo', 'aereo', 'ryanair', 'easyjet', 'wizz', 'hotel', 'albergo', 'airbnb', 'booking', 'b&b', 'bnb', 'vacanza', 'viaggio', 'weekend', 'traghetto', 'ostello']),
    ],
  },
  {
    id: 'regali', name: 'Regali', icon: '🎁', group: 'personale', budgetPct: 3,
    subs: [sub('regali', 'Regali', ['regalo', 'regali', 'pensierino', 'fiori', 'mazzo di fiori'])],
  },
  {
    id: 'altro', name: 'Altro', icon: '📦', group: 'personale', budgetPct: 2,
    subs: [sub('varie', 'Varie', [])],
  },
]

export const DEFAULT_INCOME_SOURCES = ['Stipendio', 'Straordinari', 'Rimborso', 'Altro']

export function catPctFrom(categories: Category[]): Record<string, number> {
  return Object.fromEntries(categories.map((c) => [c.id, c.budgetPct]))
}

export function defaultSettings(startMonth: string): Settings {
  const allocation = {
    savingsPct: 60,
    needsPct: 20,
    personalPct: 20,
    catPct: catPctFrom(DEFAULT_CATEGORIES),
  }
  return {
    categories: DEFAULT_CATEGORIES,
    allocation,
    allocationHistory: { [startMonth]: allocation },
    startMonth,
    initialSavings: 434,
    initialFund: 0,
    initialVouchers: 0,
    voucherValue: 8,
    expectedIncome: 1800,
    incomeSources: DEFAULT_INCOME_SOURCES,
    recapSeen: [],
  }
}
