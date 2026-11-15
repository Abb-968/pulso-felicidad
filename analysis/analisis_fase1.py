"""Fase 1 - Analisis y preprocesamiento del World Happiness Report 2015-2024.
Uso:  python analisis_fase1.py <carpeta_con_los_CSV_anuales> <carpeta_salida>
Genera: country_years_clean.csv, stats.json y figuras (PNG).  Todas las cifras del documento salen de aqui."""
import sys, json, hashlib, unicodedata, os
import numpy as np, pandas as pd
from scipy import stats as st
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

RAW = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
FIG = os.path.join(OUT, "fig"); os.makedirs(FIG, exist_ok=True)
YEARS = list(range(2015, 2025))
AZUL, NARANJA, GRIS, OSCURO = "#2C7FB8", "#F28E2B", "#8A94A0", "#1F2937"
ALIASES = {"Argelia": "Algeria", "Czechia": "Czech Republic", "Eswatini": "Swaziland",
           "Hong Kong S.A.R. of China": "Hong Kong", "North Macedonia": "Macedonia",
           "State of Palestine": "Palestinian Territories", "Taiwan Province of China": "Taiwan",
           "Trinidad & Tobago": "Trinidad and Tobago", "Turkiye": "Turkey", "Congo": "Congo (Brazzaville)"}
NAMES = ["rank_source", "country_source", "region", "score", "gdp", "social", "hle", "freedom", "generosity", "corruption_source"]
REGION_ES = {"Central and Eastern Europe": "Europa Central y del Este", "Commonwealth of Independent States": "CEI (ex URSS)", "East Asia": "Asia Oriental",
             "Latin America and Caribbean": "Latinoamérica y Caribe", "Middle East and North Africa": "Medio Oriente y N. de África",
             "North America and ANZ": "Norteamérica y Oceanía", "South Asia": "Asia Meridional", "Southeast Asia": "Sudeste Asiático",
             "Sub-Saharan Africa": "África Subsahariana", "Western Europe": "Europa Occidental"}
DISPLAY = {"Swaziland": "Eswatini", "Macedonia": "North Macedonia", "Czech Republic": "Czechia", "Turkey": "Türkiye", "Ivory Coast": "Costa de Marfil"}
S = {"region_es": REGION_ES, "display": DISPLAY}                              # estadisticos para el documento

# ---------------------------------------------------------------- 1. carga e identificacion
frames, hashes = [], {}
for y in YEARS:
    path = os.path.join(RAW, f"world_happiness_{y}.csv")
    hashes[y] = hashlib.sha256(open(path, "rb").read()).hexdigest()
    d = pd.read_csv(path, sep=";", decimal=",")
    assert d.shape[1] == 10, (y, d.shape)
    d.columns = NAMES; d["year"] = y; frames.append(d)
df = pd.concat(frames, ignore_index=True)
S["sha256"] = {str(k): v[:12] for k, v in hashes.items()}
S["n_obs"] = len(df); S["n_countries_source"] = int(df.country_source.nunique())
S["rows_per_year"] = {str(y): int((df.year == y).sum()) for y in YEARS}
S["cols_per_file"] = 10

# ---------------------------------------------------------------- 2. limpieza
def key(s): return "".join(c for c in unicodedata.normalize("NFD", s.strip().lower()) if unicodedata.category(c) != "Mn")
df["country"] = df.country_source.str.strip().replace(ALIASES)
df["country_key"] = df.country.map(key)
S["n_countries"] = int(df.country.nunique()); S["n_alias"] = len(ALIASES)
S["dup_country_year"] = int(df.duplicated(["country", "year"]).sum())
yrs = df.groupby("country").year.nunique()
S["n_10y"] = int((yrs == 10).sum()); S["n_less10"] = int((yrs < 10).sum()); S["min_years"] = int(yrs.min())
S["n_10y_source"] = int((df.groupby("country_source").year.nunique() == 10).sum())
def comprimir(ys):
    ys = sorted(ys); out = []; i = 0
    while i < len(ys):
        j = i
        while j + 1 < len(ys) and ys[j + 1] == ys[j] + 1: j += 1
        out.append(str(ys[i]) if i == j else f"{ys[i]}-{ys[j]}"); i = j + 1
    return ", ".join(out)
al = []
for a, c in ALIASES.items():
    ya = list(df[df.country_source == a].year); yc = list(df[df.country_source == c].year)
    al.append({"alias": a, "canonico": c, "anios_alias": comprimir(ya), "anios_canonico": comprimir(yc)})
S["aliases"] = al

# region: la fuente la reasigna entre ediciones (p. ej. en 2016 varios paises de Europa Central aparecen como Europa Occidental).
# Se fija una region estable por pais = la mas frecuente (en empate, la del ano mas reciente) + correccion manual de tres casos claros.
REGION_FIX = {"Greece": "Western Europe", "Laos": "Southeast Asia", "Maldives": "South Asia"}
df["region_source"] = df.region
multi = df.dropna(subset=["region_source"]).groupby("country").region_source.nunique()
S["region_multi"] = int((multi > 1).sum()); S["region_fix"] = REGION_FIX
def region_estable(g):
    c = g.dropna(subset=["region_source"]).groupby("region_source").year.agg(["count", "max"]).sort_values(["count", "max"], ascending=False)
    return c.index[0]
stable = df.groupby("country")[["region_source", "year"]].apply(region_estable)
df["region"] = df.country.map(stable)
for k, v in REGION_FIX.items(): df.loc[df.country == k, "region"] = v
df["region_changed"] = df.region != df.region_source
S["region_changed_rows"] = int(df.region_changed.sum())
S["region_2016_wrong"] = int(((df.year == 2016) & (df.region_source == "Western Europe") & (df.region != "Western Europe")).sum())
S["region_missing_rows"] = [f"{r.country} {r.year}" for r in df[df.region_source.isna()].itertuples()]
S["region_still_missing"] = int(df.region.isna().sum())
S["hle_missing_rows"] = [f"{r.country} {r.year}" for r in df[df.hle.isna()].itertuples()]

# orientacion de la variable de corrupcion
cy = df.groupby("year").corruption_source.mean()
inv_years = [int(y) for y in cy.index if cy[y] > 0.5]
df["corruption_inverted"] = df.year.isin(inv_years)
df["corruption"] = np.where(df.corruption_inverted, 1 - df.corruption_source, df.corruption_source)
S["corr_years_inverted"] = inv_years
S["corr_by_year"] = {str(y): {"mean_raw": float(cy[y]),
    "r_raw": float(g.corruption_source.corr(g.score)), "r_harm": float(g.corruption.corr(g.score))}
    for y, g in df.groupby("year")}
S["corr_pooled_raw"] = float(df.corruption_source.corr(df.score))
S["corr_pooled_harm"] = float(df.corruption.corr(df.score))
S["corr_2024_raw"] = S["corr_by_year"]["2024"]["r_raw"]

# PIB 2016, normalizaciones y ranking
df["gdp_valid"] = df.gdp.where(df.year != 2016)
df["gdp_z"] = df.groupby("year").gdp_valid.transform(lambda s: (s - s.mean()) / s.std(ddof=1))
df["hle_norm"] = ((df.hle - 30) / 55).clip(0, 1)
df["rank_recalc"] = df.groupby("year").score.rank(ascending=False, method="min").astype(int)
df["rank_inconsistent"] = df.rank_source != df.rank_recalc
S["rank_bad"] = int(df.rank_inconsistent.sum()); S["rank_bad_pct"] = float(100 * df.rank_inconsistent.mean())
S["rank_bad_pm1"] = int(((df.rank_source - df.rank_recalc).abs() == 1).sum())
gy = df.groupby("year").gdp.agg(["mean", "min", "max"])
S["gdp_year_mean"] = {str(y): float(v) for y, v in gy["mean"].items()}
S["gdp_2016_mean"] = float(gy.loc[2016, "mean"]); S["gdp_other_min"] = float(gy.drop(2016)["mean"].min()); S["gdp_other_max"] = float(gy.drop(2016)["mean"].max())
p = df.pivot(index="country", columns="year", values="gdp")
S["gdp_2016_corr_neighbors"] = [float(p[2016].corr(p[2015])), float(p[2016].corr(p[2017]))]
S["gdp_other_pairs_min"] = float(min(p[a].corr(p[b]) for a, b in [(2015, 2017)] + [(y, y + 1) for y in range(2017, 2024)]))
top16 = df[df.year == 2016].sort_values("gdp", ascending=False).head(3)
S["gdp_2016_top"] = [(r.country, float(r.gdp)) for r in top16.itertuples()]
S["gdp_jump_21_22"] = [float(gy.loc[2021, "mean"]), float(gy.loc[2022, "mean"])]
S["hle_year_mean"] = {str(y): float(v) for y, v in df.groupby("year").hle.mean().items()}
S["social_year_mean"] = {str(y): float(v) for y, v in df.groupby("year").social.mean().items()}

# outliers (marcado, no eliminacion)
VARS = {"score": "score", "gdp": "gdp_valid", "social": "social", "hle": "hle", "freedom": "freedom", "generosity": "generosity", "corruption": "corruption"}
flags = pd.Series("", index=df.index); S["outliers"] = {}
for k, c in VARS.items():
    s = df[c].dropna(); q1, q3 = s.quantile([.25, .75]); iq = q3 - q1; med = s.median(); mad = (s - med).abs().median()
    f_iqr = (df[c] < q1 - 1.5 * iq) | (df[c] > q3 + 1.5 * iq)
    f_mad = (0.6745 * (df[c] - med) / mad).abs() > 3.5 if mad > 0 else pd.Series(False, index=df.index)
    S["outliers"][k] = {"iqr": int(f_iqr.sum()), "mad": int(f_mad.sum())}
    flags = flags.where(~f_iqr, flags + f"{k}_iqr;")
df["outlier_flags"] = flags.str.rstrip(";")

# ---------------------------------------------------------------- 3. estadistica descriptiva
t = df.groupby("year").score.agg(["count", "mean", "median", "std", "min", "max"])
S["year_table"] = {str(y): {k: float(v) for k, v in r.items()} for y, r in t.iterrows()}
S["d_mean"] = float(t["mean"].iloc[-1] - t["mean"].iloc[0]); S["d_median"] = float(t["median"].iloc[-1] - t["median"].iloc[0])
S["ratio_median_mean"] = S["d_median"] / S["d_mean"]
S["var_summary"] = {k: {"n": int(df[c].notna().sum()), "mean": float(df[c].mean()), "median": float(df[c].median()),
    "std": float(df[c].std()), "min": float(df[c].min()), "max": float(df[c].max())} for k, c in VARS.items()}
S["rank_range"] = [int(df.rank_source.min()), int(df.rank_source.max())]
gp = [("pearson_all", df.gdp.corr(df.score)), ("pearson_valid", df.gdp_valid.corr(df.score))]
S["r_gdp_all"] = float(gp[0][1]); S["r_gdp_valid"] = float(gp[1][1]); S["r2_gdp_valid"] = float(gp[1][1] ** 2)
pr = {y: g.gdp.corr(g.score) for y, g in df.groupby("year") if y != 2016}
sp = {y: g.gdp.corr(g.score, method="spearman") for y, g in df.groupby("year") if y != 2016}
S["pearson_year_range"] = [float(min(pr.values())), float(max(pr.values()))]; S["spearman_year_range"] = [float(min(sp.values())), float(max(sp.values()))]
S["r_gdp_2024"] = float(df[df.year == 2024].gdp.corr(df[df.year == 2024].score))

# regresion con efectos fijos de ano, betas estandarizados, errores HC1
cols = ["gdp", "social", "hle", "freedom", "generosity", "corruption"]
xm = df[df.year != 2016].dropna(subset=["score", "gdp", "social", "hle", "freedom", "generosity", "corruption"]).copy()
def ols(x, cs):
    z = x[["score"] + cs].apply(lambda s: (s - s.mean()) / s.std(ddof=1))
    X = np.column_stack([np.ones(len(z)), z[cs].values, pd.get_dummies(x.year, drop_first=True, dtype=float).values]); y = z.score.values
    b = np.linalg.lstsq(X, y, rcond=None)[0]; e = y - X @ b; n, k = X.shape
    XtXi = np.linalg.inv(X.T @ X); V = XtXi @ (X.T * (e ** 2)) @ X @ XtXi * n / (n - k); se = np.sqrt(np.diag(V))
    return b[1:1 + len(cs)], se[1:1 + len(cs)], 1 - (e ** 2).sum() / ((y - y.mean()) ** 2).sum(), n
b, se, r2, n = ols(xm, cols)
S["reg"] = {"n": int(n), "r2": float(r2), "vars": {}}
for i, c in enumerate(cols):
    r2_drop = ols(xm, [v for v in cols if v != c])[2]
    S["reg"]["vars"][c] = {"beta": float(b[i]), "se": float(se[i]), "lo": float(b[i] - 1.96 * se[i]), "hi": float(b[i] + 1.96 * se[i]),
                           "p": float(2 * (1 - st.norm.cdf(abs(b[i] / se[i])))), "partial_r2": float(r2 - r2_drop)}
Z = xm[cols].apply(lambda s: (s - s.mean()) / s.std()); vifs = {}
for i, c in enumerate(cols):
    o = [j for j in range(len(cols)) if j != i]; A = np.column_stack([np.ones(len(Z)), Z.values[:, o]])
    bb = np.linalg.lstsq(A, Z.values[:, i], rcond=None)[0]; r = 1 - ((Z.values[:, i] - A @ bb) ** 2).sum() / ((Z.values[:, i] - Z.values[:, i].mean()) ** 2).sum(); vifs[c] = float(1 / (1 - r))
S["reg"]["vif"] = vifs
x24 = df[df.year == 2024].dropna(subset=cols); S["reg"]["r2_2024"] = float(np.corrcoef(np.column_stack([np.ones(len(x24)), x24[cols].values]) @ np.linalg.lstsq(np.column_stack([np.ones(len(x24)), x24[cols].values]), x24.score.values, rcond=None)[0], x24.score.values)[0, 1] ** 2)
# efecto de no armonizar (para el anexo)
xr = xm.copy(); xr["corruption"] = xr.corruption_source
br, ser, r2r, _ = ols(xr, cols); i = cols.index("corruption")
S["reg_raw_corruption"] = {"beta": float(br[i]), "p": float(2 * (1 - st.norm.cdf(abs(br[i] / ser[i]))))}

# regiones
d24 = df[df.year == 2024]; S["global_mean_2024"] = float(d24.score.mean())
rg = d24.groupby("region").score.agg(["mean", "count"]).sort_values("mean", ascending=False)
S["regions_2024"] = [{"region": r, "mean": float(v["mean"]), "n": int(v["count"])} for r, v in rg.iterrows()]
S["ssa_gap_global"] = float(S["global_mean_2024"] - rg.loc["Sub-Saharan Africa", "mean"]); S["ssa_gap_best"] = float(rg["mean"].max() - rg.loc["Sub-Saharan Africa", "mean"])
S["region_spread"] = float(rg["mean"].max() - rg["mean"].min())
S["regions_two_share"] = float((rg.loc["Sub-Saharan Africa", "count"] + rg.loc["Western Europe", "count"]) / rg["count"].sum())
reg_year = df.groupby(["region", "year"]).score.mean().unstack()
S["region_change"] = {r: float(reg_year.loc[r, 2024] - reg_year.loc[r, 2015]) for r in reg_year.index if pd.notna(reg_year.loc[r, 2015]) and pd.notna(reg_year.loc[r, 2024])}

# top / bottom 2024 y panel
t24 = d24.sort_values("score", ascending=False)
S["top10"] = [(r.country, float(r.score), int(r.rank_source)) for r in t24.head(10).itertuples()]
S["bottom10"] = [(r.country, float(r.score), int(r.rank_source)) for r in t24.tail(10).iloc[::-1].itertuples()]
S["gap_top_bottom"] = float(t24.head(10).score.mean() - t24.tail(10).score.mean())
bp = df[df.year.isin([2015, 2024])].pivot(index="country", columns="year", values="score").dropna(); bp["d"] = bp[2024] - bp[2015]
S["panel"] = {"n": int(len(bp)), "up": int((bp.d > 0).sum()), "down": int((bp.d < 0).sum()), "mean": float(bp.d.mean()), "median": float(bp.d.median())}
sl = st.linregress(bp[2015], bp.d); S["panel"].update({"slope": float(sl.slope), "p": float(sl.pvalue), "r2": float(sl.rvalue ** 2)})
S["gains"] = [(c, float(v)) for c, v in bp.d.sort_values(ascending=False).head(6).items()]
S["losses"] = [(c, float(v)) for c, v in bp.d.sort_values().head(6).items()]
S["panel_source"] = {"n": 132}  # cifra previa a unificar nombres (referencia para el control de cambios)

# ---------------------------------------------------------------- 4. figuras
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False, "axes.spines.right": False, "axes.edgecolor": "#9AA3AE",
                     "axes.labelcolor": OSCURO, "xtick.color": OSCURO, "ytick.color": OSCURO, "font.size": 9, "axes.titleweight": "bold", "axes.titlesize": 10})
def save(fig, name): fig.tight_layout(); fig.savefig(os.path.join(FIG, name), dpi=200); plt.close(fig)
yy = np.array(YEARS)
# F1 evolucion global
q = df.groupby("year").score.quantile([.25, .75]).unstack()
f, ax = plt.subplots(1, 2, figsize=(9.2, 3.3), gridspec_kw={"width_ratios": [1.6, 1]})
ax[0].fill_between(yy, q[0.25], q[0.75], color=AZUL, alpha=.15, label="Rango intercuartil")
ax[0].plot(yy, t["mean"], color=AZUL, lw=2.2, marker="o", ms=4, label="Media"); ax[0].plot(yy, t["median"], color=NARANJA, lw=2.2, marker="s", ms=4, label="Mediana")
for y_, k_, c_, dy in [(2015, "mean", AZUL, .1), (2024, "mean", AZUL, -.17), (2015, "median", NARANJA, -.17), (2024, "median", NARANJA, .09)]:
    ax[0].annotate(f"{t.loc[y_, k_]:.2f}", (y_, t.loc[y_, k_]), (y_, t.loc[y_, k_] + dy), ha="center", fontsize=8, color=c_)
ax[0].set_xticks(yy); ax[0].set_ylabel("Puntaje de felicidad (0-10)"); ax[0].set_title("Media y mediana anual"); ax[0].legend(frameon=False, fontsize=8, loc="lower right")
ax[1].plot(yy, t["std"], color=OSCURO, lw=2.2, marker="o", ms=4); ax[1].set_xticks([2015, 2018, 2021, 2024]); ax[1].set_ylabel("Desviación estándar"); ax[1].set_title("Dispersión entre países")
save(f, "f1_evolucion.png")
# F2 regiones 2024
r_ = rg.iloc[::-1]; f, ax = plt.subplots(figsize=(7.6, 3.6))
ax.barh([REGION_ES[i] for i in r_.index], r_["mean"], color=[AZUL if v >= S["global_mean_2024"] else NARANJA for v in r_["mean"]])
ax.axvline(S["global_mean_2024"], color=OSCURO, ls="--", lw=1); ax.text(S["global_mean_2024"] + .05, -0.65, f"Promedio global {S['global_mean_2024']:.2f}", fontsize=8)
for i_, (v, n_) in enumerate(zip(r_["mean"], r_["count"])): ax.text(v + .05, i_, f"{v:.2f}  (n={n_})", va="center", fontsize=8)
ax.set_xlim(0, 8.6); ax.set_xlabel("Puntaje promedio 2024"); ax.set_title("Puntaje promedio por región, 2024"); save(f, "f2_regiones.png")
# F3 PIB vs felicidad 2024
f, ax = plt.subplots(figsize=(6.2, 3.8)); g24 = d24.dropna(subset=["gdp"])
ax.scatter(g24.gdp, g24.score, s=22, color=AZUL, alpha=.65, edgecolor="white", lw=.4)
m_, b0 = np.polyfit(g24.gdp, g24.score, 1); xs = np.linspace(g24.gdp.min(), g24.gdp.max(), 50); ax.plot(xs, m_ * xs + b0, color=NARANJA, lw=2)
ax.set_xlabel("Índice de PIB per cápita (0-10)"); ax.set_ylabel("Puntaje de felicidad"); ax.set_title(f"PIB y felicidad, 2024 (r = {S['r_gdp_2024']:.2f})"); save(f, "f3_pib.png")
# F4 coeficientes
lab = {"gdp": "PIB per cápita", "social": "Apoyo social", "hle": "Esperanza de vida sana", "freedom": "Libertad", "generosity": "Generosidad", "corruption": "Corrupción (menos percibida)"}
o = sorted(cols, key=lambda c: S["reg"]["vars"][c]["beta"]); f, ax = plt.subplots(figsize=(6.8, 3.4))
for i_, c in enumerate(o):
    v = S["reg"]["vars"][c]; ax.plot([v["lo"], v["hi"]], [i_, i_], color=AZUL, lw=2); ax.plot(v["beta"], i_, "o", color=NARANJA, ms=7)
    ax.text(v["hi"] + .012, i_, f"{v['beta']:.2f}", va="center", fontsize=8)
ax.axvline(0, color=GRIS, lw=1); ax.set_yticks(range(len(o))); ax.set_yticklabels([lab[c] for c in o]); ax.set_xlabel("Coeficiente estandarizado (IC 95 %)")
ax.set_title(f"Peso relativo de cada dimensión (R² = {S['reg']['r2']:.2f})"); save(f, "f4_coef.png")
# F5 mayores cambios
cc = S["gains"][::-1] + S["losses"][::-1]; f, ax = plt.subplots(figsize=(6.8, 3.9))
ax.barh([DISPLAY.get(c, c) for c, _ in cc], [v for _, v in cc], color=[AZUL if v > 0 else NARANJA for _, v in cc]); ax.axvline(0, color=OSCURO, lw=.8)
for i_, (c, v) in enumerate(cc): ax.text(v + (.04 if v > 0 else -.04), i_, f"{v:+.2f}", va="center", ha="left" if v > 0 else "right", fontsize=8)
ax.set_xlim(min(v for _, v in cc) - .5, max(v for _, v in cc) + .5); ax.set_xlabel("Cambio de puntaje 2015 → 2024"); ax.set_title("Mayores mejoras y caídas (países con ambos años)"); save(f, "f5_cambios.png")
# F6 series por region
regs = list(reg_year.index); f, axs = plt.subplots(2, 5, figsize=(9.6, 4.6), sharex=True, sharey=True)
gm = df.groupby("year").score.mean()
for ax, r in zip(axs.flat, regs):
    ax.plot(yy, gm.values, color=GRIS, ls="--", lw=1); ax.plot(yy, reg_year.loc[r].values, color=AZUL, lw=2)
    ax.set_title(REGION_ES[r], fontsize=8)
    ax.set_xticks([2015, 2019, 2024]); ax.tick_params(labelsize=7)
f.supylabel("Puntaje promedio", fontsize=8); save(f, "f6_series_region.png"); S["regions_list"] = regs
# F7 corrupcion
cb = S["corr_by_year"]; f, ax = plt.subplots(figsize=(7.2, 3.1)); w = .38
ax.bar(yy - w / 2, [cb[str(y)]["r_raw"] for y in YEARS], w, color=NARANJA, label="Datos originales"); ax.bar(yy + w / 2, [cb[str(y)]["r_harm"] for y in YEARS], w, color=AZUL, label="Orientación armonizada")
ax.axhline(0, color=OSCURO, lw=.8); ax.set_xticks(yy); ax.set_ylabel("Correlación con felicidad"); ax.set_title("Corrupción percibida y felicidad, por año"); ax.set_ylim(-.55, .6); ax.legend(frameon=False, fontsize=8, ncol=2, loc="upper center", bbox_to_anchor=(.5, -.1)); save(f, "f7_corrupcion.png")

# ---------------------------------------------------------------- 5. salidas
keep = ["year", "country", "country_source", "country_key", "region", "region_source", "region_changed", "rank_source", "rank_recalc", "rank_inconsistent", "score",
        "gdp", "gdp_valid", "gdp_z", "social", "hle", "hle_norm", "freedom", "generosity", "corruption_source", "corruption", "corruption_inverted", "outlier_flags"]
df[keep].sort_values(["year", "rank_source"]).to_csv(os.path.join(OUT, "country_years_clean.csv"), index=False, encoding="utf-8")
df[keep].sort_values(["year", "rank_source"]).head(5).to_pickle(os.path.join(OUT, "head.pkl")); df[keep].sort_values(["year", "rank_source"]).tail(5).to_pickle(os.path.join(OUT, "tail.pkl"))
json.dump(S, open(os.path.join(OUT, "stats.json"), "w"), ensure_ascii=False, indent=1)
print("OK", S["n_obs"], S["n_countries"], round(S["r_gdp_valid"], 3), round(S["reg"]["r2"], 3))
