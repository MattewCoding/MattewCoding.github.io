const dura = {
    country_info_fade_in_duration: 2000,
    typewriter_delay: 50,
};

const countries = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", /*"EU-28",*/ "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "North Macedonia", "Poland", "Portugal", "Romania", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "United Kingdom",
];

const countriesOrder = {
    "Austria": 0, "Belgium": 1, "Bulgaria": 2, "Croatia": 3, "Cyprus": 4, "Czechia": 5, "Denmark": 6, "Estonia": 7, "Finland": 8, "France": 9, "Germany": 10, "Greece": 11, "Hungary": 12, "Ireland": 13, "Italy": 14, "Latvia": 15, "Lithuania": 16, "Luxembourg": 17, "Malta": 18, "Netherlands": 19, "North Macedonia": 20, "Poland": 21, "Portugal": 22, "Romania": 23, "Serbia": 24, "Slovakia": 25, "Slovenia": 26, "Spain": 27, "Sweden": 28, "United Kingdom": 29
};

const ans_to_weight = {
    "Yes, definitely" : 2,
    "Yes, probably" : 1,
    "No, probably not" : -1,
    "No, definitely not" : -2,

    "Dont know" : 0
};

const age_range_to_value = {
    "5y.o. or less" : 0,
    "6-9y.o." : 1,
    "10-14y.o." : 2,
    "15-17y.o." : 3,
    "18-24y.o." : 4,
    "25-34y.o." : 5,
    "35-54y.o." : 6,
    "55y.o. or more" : 7,
};

const value_to_age_range = {
    0: 0,
    1: 6,
    2: 10,
    3: 15,
    4: 18,
    5: 25,
    6: 35,
    7: 55,
    8: 60,
};

const subset = [
    "All",
    "Bisexual men", "Bisexual women",
    "Gay men", "Lesbian women",
    //"Intersex people",
    "Trans people",
];

const ctx = {
    MAP_W: 0,
    MAP_H: 0,
    RATIO: 1.2102868388897439,
    OLD_SEL: "Austria",
    MAP_QUESTION: "",

    SP_W: {},

    SUBSET_SELECTED: "All",

    INFO_W: 350,
    INFO_MARGIN: 10,
    TITLE_PX: "16px",
    TITLE_POSITION_Y: 14,

    JITTER_W: 40,

    BAR1_QUESTIONS: "DEXindd1_2",
    BAR2_QUESTIONS: "DEXindd1_2",
    BAR3A_QUESTIONS: "DEXc10_a",
    BAR3B_QUESTIONS: "DEXschool_negcon",
    SP1_QUESTIONS_X: "DEXindd1_2A",
    SP1_QUESTIONS_Y: "DEXgov_resp",

    SP2_QUESTIONS_X: "DEXopen_at_schoolFRA", // School
    SP2_QUESTIONS_Y: "DEXindg1c", // At work
    SP3_QUESTIONS_X: "DEXg1_B", // friends
    SP3_QUESTIONS_Y: "DEXg1_A", // family
    
    CDF1_QUESTIONS: ["DEXa13"],
    VP1_QUESTION: "DEXlife_sat",
};