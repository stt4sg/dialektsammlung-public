export const up = async function (db: any): Promise<any> {
  return db.runSql(`
		CREATE TABLE cantons
    (
      canton VARCHAR(2) NOT NULL PRIMARY KEY,
      name VARCHAR(32) NOT NULL,
      numberOfPeople INT NOT NULL,
      germanSpeakingRate FLOAT NOT NULL,
      flag TEXT NULL
    );

    INSERT INTO cantons(canton, name, numberOfPeople, germanSpeakingRate, flag)
        VALUES
        ('AG', 'Aargau', 685845, 0.871, '/img/cantons/Aargau.png'),
        ('AI', 'Appenzell Innerrhoden', 16128, 1.0 ,'/img/cantons/Appenzell Innerrhoden.png'),
        ('AR', 'Appenzell Ausserrhoden', 55445, 0.912, '/img/cantons/Appenzell Ausserrhoden.png'),
        ('BE', 'Bern', 1039474, 0.86, '/img/cantons/Bern.png'),
        ('BL', 'Basel-Landschaft', 289468, 0.872, '/img/cantons/Basel-Landschaft.png'),
        ('BS', 'Basel-Stadt', 195844, 0.793, '/img/cantons/Basel-Stadt.png'),
        ('FR', 'Freiburg', 321783, 0.307, '/img/cantons/Freiburg.png'),
        ('GE', 'Genf', 504128, 0.05, '/img/cantons/Genf.png'),
        ('GL', 'Glarus', 40590, 0.836, '/img/cantons/Glarus.png'),
        ('GR', 'Graubünden', 199021, 0.68, '/img/cantons/Graubünden.png'),
        ('JU', 'Jura', 73584, 0.072, '/img/cantons/Jura.png'),
        ('LU', 'Luzern', 413120, 0.904, '/img/cantons/Luzern.png'),
        ('NE', 'Neuenburg', 176496, 0.06, '/img/cantons/Neuenburg.png'),
        ('NW', 'Nidwalden', 43087, 0.921, '/img/cantons/Nidwalden.png'),
        ('OW', 'Obwalden', 37930, 0.925, '/img/cantons/Obwalden.png'),
        ('SG', 'St. Gallen', 510734, 0.893, '/img/cantons/St_Gallen.png'),
        ('SH', 'Schaffhausen', 82348, 0.888, '/img/cantons/Schaffhausen.png'),
        ('SO', 'Solothurn', 275247, 0.899, '/img/cantons/Solothurn.png'),
        ('SZ', 'Schwyz', 160480, 0.884, '/img/cantons/Schwyz.png'),
        ('TG', 'Thurgau', 279547, 0.885, '/img/cantons/Thurgau.png'),
        ('TI', 'Tessin', 351491, 0.108, '/img/cantons/Tessin.png'),
        ('UR', 'Uri', 36703, 0.941, '/img/cantons/Uri.png'),
        ('VD', 'Waadt', 805098, 0.0475, '/img/cantons/Waadt.png'),
        ('VS', 'Wallis', 345525, 0.284, '/img/cantons/Wallis.png'),
        ('ZG', 'Zug', 127642, 0.851, '/img/cantons/Zug.png'),
        ('ZH', 'Zürich', 1539275, 0.834, '/img/cantons/Zürich.png')
    ON DUPLICATE KEY UPDATE canton=canton
	`);
};
export const down = function (): Promise<any> {
  return null;
};
