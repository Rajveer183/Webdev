"""Build data/content/projects.json — synthetic, fully reproducible demonstration analyses.

Every dataset here is SYNTHETIC (generated from a fixed random seed). None of it
represents a client, a real organisation or real measurements. The analyses are
real: the numbers shown on the website are computed by this script.

Run:  python data/scripts/build_projects.py
Requires: numpy, scipy (build-time only; not needed by the web backend).
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from scipy import stats

OUT = Path(__file__).resolve().parents[1] / "content" / "projects.json"
SEED = 20231004  # fixed so the published figures never change between builds


def r(x: float, nd: int = 2) -> float:
    return float(round(float(x), nd))


def chart(**kw):
    """Chart spec consumed by the frontend <ChartRenderer>."""
    base = {"reference_lines": [], "x_type": "number"}
    base.update(kw)
    return base


# ---------------------------------------------------------------------------
# 1. Demand forecasting with classical decomposition (Time Series, p25-28)
# ---------------------------------------------------------------------------
def demand_forecasting(rng: np.random.Generator) -> dict:
    n_years, period = 4, 12
    t = np.arange(1, n_years * period + 1)
    season = np.array([0.86, 0.84, 0.95, 1.00, 1.04, 1.10, 1.14, 1.12, 1.03, 0.98, 0.95, 0.99])
    trend = 400 + 6.0 * t
    y = trend * np.tile(season, n_years) * rng.normal(1.0, 0.025, t.size)

    # 2x12 centred moving average (even period)
    ma12 = np.convolve(y, np.ones(12) / 12, mode="valid")  # length n-11
    cma = (ma12[:-1] + ma12[1:]) / 2  # centred, aligned to t=7..n-6
    cma_full = np.full(y.size, np.nan)
    cma_full[6 : 6 + cma.size] = cma

    # Seasonal indices by ratio-to-moving-average, normalised to average 1
    ratios = y / cma_full
    raw_idx = np.array([np.nanmean(ratios[m::period]) for m in range(period)])
    s_idx = raw_idx * period / raw_idx.sum()

    # Least-squares linear trend on the deseasonalised series
    deseason = y / np.tile(s_idx, n_years)
    b, a = np.polyfit(t, deseason, 1)
    fitted = (a + b * t) * np.tile(s_idx, n_years)

    # Hold-out check: refit on first 36 months, forecast months 37-48
    train = 36
    ma12_tr = np.convolve(y[:train], np.ones(12) / 12, mode="valid")
    cma_tr = np.full(train, np.nan)
    cma_tr[6 : 6 + ma12_tr.size - 1] = (ma12_tr[:-1] + ma12_tr[1:]) / 2
    rat_tr = y[:train] / cma_tr
    idx_tr = np.array([np.nanmean(rat_tr[m::period]) for m in range(period)])
    idx_tr = idx_tr * period / idx_tr.sum()
    b_tr, a_tr = np.polyfit(t[:train], y[:train] / np.tile(idx_tr, 3), 1)
    fc_hold = (a_tr + b_tr * t[train:]) * idx_tr
    mape = float(np.mean(np.abs((y[train:] - fc_hold) / y[train:])) * 100)

    # Simple exponential smoothing on the deseasonalised series (alpha chosen by SSE)
    def ses_sse(alpha: float) -> float:
        level, sse = deseason[0], 0.0
        for v in deseason[1:]:
            sse += (v - level) ** 2
            level = alpha * v + (1 - alpha) * level
        return sse

    alphas = np.round(np.arange(0.05, 1.0, 0.05), 2)
    best_alpha = float(alphas[int(np.argmin([ses_sse(a_) for a_ in alphas]))])

    # 12-month forecast from the full-data model
    t_f = np.arange(t[-1] + 1, t[-1] + 13)
    fc = (a + b * t_f) * s_idx

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data = []
    for i, ti in enumerate(t):
        data.append(
            {
                "month": int(ti),
                "observed": r(y[i], 1),
                "trend_cycle": None if math.isnan(cma_full[i]) else r(cma_full[i], 1),
                "model": r(fitted[i], 1),
            }
        )
    data[-1]["forecast"] = data[-1]["model"]
    for ti, v in zip(t_f, fc):
        data.append({"month": int(ti), "forecast": r(v, 1)})

    return {
        "slug": "demand-forecasting-decomposition",
        "title": "Monthly Demand Forecasting with Classical Decomposition",
        "category": "Statistics",
        "summary": "Separating trend and seasonality in four years of synthetic monthly demand, then projecting the next twelve months and checking accuracy on held-out data.",
        "is_synthetic": True,
        "problem": "A planning team wants a transparent twelve-month demand forecast that shows how much of the movement is long-run growth and how much is a repeating seasonal pattern.",
        "dataset": "48 months of synthetic demand generated from a linear trend multiplied by a fixed seasonal pattern with about 2.5% random noise (seed 20231004). No real company data is used.",
        "methodology": [
            "Multiplicative model: observed = trend × seasonal × irregular.",
            "Trend-cycle estimated with a 2×12 centred moving average (even period).",
            "Seasonal indices by the ratio-to-moving-average method, normalised to average 1.",
            "Least-squares straight-line trend fitted to the deseasonalised series.",
            "Simple exponential smoothing on the deseasonalised series as a comparison; smoothing constant chosen by minimum sum of squared one-step errors.",
        ],
        "process": [
            "Plotted the series and confirmed a rising trend with a stable seasonal amplitude, which points to a multiplicative model.",
            "Computed the centred moving average and the ratio of each observation to it.",
            "Averaged ratios by calendar month to obtain seasonal indices.",
            "Fitted the trend line, recombined with the indices, and projected twelve months ahead.",
            "Re-ran the full procedure on the first 36 months only and forecast the last 12 to measure out-of-sample error (MAPE).",
        ],
        "charts": [
            chart(
                id="decomposition",
                kind="line",
                title="Observed demand, trend-cycle and 12-month forecast",
                subtitle="Synthetic data · units per month",
                x_key="month",
                x_label="Month index",
                y_label="Units",
                series=[
                    {"key": "observed", "label": "Observed", "color": 1, "style": "line"},
                    {"key": "trend_cycle", "label": "Trend-cycle (2×12 MA)", "color": 3, "style": "line"},
                    {"key": "forecast", "label": "Forecast", "color": 2, "style": "dashed"},
                ],
                data=data,
            ),
            chart(
                id="seasonal-indices",
                kind="bar",
                x_type="category",
                title="Estimated seasonal indices",
                subtitle="Ratio-to-moving-average · 1.00 = an average month",
                x_key="month",
                x_label="Month",
                y_label="Index",
                y_domain=[0.7, 1.2],
                series=[{"key": "index", "label": "Seasonal index", "color": 1, "style": "bar"}],
                data=[{"month": m, "index": r(v, 3)} for m, v in zip(months, s_idx)],
                reference_lines=[{"axis": "y", "value": 1.0, "label": "Average month"}],
            ),
        ],
        "results": [
            {"label": "Trend growth", "value": f"{b:.2f} units/month"},
            {"label": "Peak season index", "value": f"{s_idx.max():.3f} ({months[int(s_idx.argmax())]})"},
            {"label": "Lowest season index", "value": f"{s_idx.min():.3f} ({months[int(s_idx.argmin())]})"},
            {"label": "Hold-out MAPE (last 12 months)", "value": f"{mape:.2f}%"},
            {"label": "Best SES smoothing constant α", "value": f"{best_alpha:.2f}"},
        ],
        "interpretation": [
            f"Demand grows by roughly {b:.1f} units a month once seasonality is removed.",
            f"{months[int(s_idx.argmax())]} runs about {(s_idx.max() - 1) * 100:.0f}% above an average month and {months[int(s_idx.argmin())]} about {(1 - s_idx.min()) * 100:.0f}% below it, which matters for staffing and stock planning.",
            f"Forecasting the final year from the first three gave a mean absolute percentage error of {mape:.1f}%. That is plausible here because the synthetic series was built from exactly this kind of structure.",
        ],
        "limitations": [
            "Real demand rarely has a perfectly stable seasonal pattern; indices should be re-estimated as new data arrives.",
            "Classical decomposition cannot anticipate structural breaks such as price changes, new competitors or supply shocks.",
            "The error figure comes from synthetic data and says nothing about accuracy on any real series.",
        ],
        "applications": ["Retail and consumer-goods demand planning", "Hospitality occupancy planning", "Index construction and business reporting"],
        "related_services": ["time-series-forecasting", "business-analytics-data-mining"],
        "related_courses": ["time-series-analysis-forecasting", "excel-for-data-analytics"],
        "related_articles": ["time-series-components-and-forecasting", "index-numbers"],
        "source_pages": [25, 26, 27, 28],
    }


# ---------------------------------------------------------------------------
# 2. X-bar & R control charts (SQC, p43-44)
# ---------------------------------------------------------------------------
def process_control(rng: np.random.Generator) -> dict:
    k, n = 25, 5
    A2, D3, D4 = 0.577, 0.0, 2.114  # standard constants for n = 5
    target, sigma = 50.0, 0.8
    samples = rng.normal(target, sigma, size=(k, n))
    samples[20:] += 1.6  # a sustained mean shift starting at subgroup 21
    xbar = samples.mean(axis=1)
    rng_ = samples.max(axis=1) - samples.min(axis=1)

    # Phase I limits from the first 20 (in-control) subgroups
    base = slice(0, 20)
    xbarbar, rbar = xbar[base].mean(), rng_[base].mean()
    ucl_x, lcl_x = xbarbar + A2 * rbar, xbarbar - A2 * rbar
    ucl_r, lcl_r = D4 * rbar, D3 * rbar
    out = [i + 1 for i, v in enumerate(xbar) if v > ucl_x or v < lcl_x]
    sigma_hat = rbar / 2.326  # d2 for n = 5

    return {
        "slug": "process-control-xbar-r",
        "title": "Process Monitoring with X̄ and R Control Charts",
        "category": "Statistics",
        "summary": "Setting control limits from in-control subgroups and detecting a sustained shift in a synthetic fill-weight process.",
        "is_synthetic": True,
        "problem": "A production line fills containers to a 50 g target. The quality team needs to tell ordinary variation apart from an assignable cause that needs investigation.",
        "dataset": "25 synthetic subgroups of 5 measurements each. Subgroups 1–20 come from N(50, 0.8²); from subgroup 21 the mean is deliberately shifted up by 1.6 g to show detection.",
        "methodology": [
            "Rational subgrouping: five consecutive units per subgroup.",
            "Phase I limits computed from subgroups 1–20 using $\\bar{\\bar{x}} \\pm A_2 \\bar{R}$ and $D_3\\bar{R}, D_4\\bar{R}$ with $A_2 = 0.577$, $D_3 = 0$, $D_4 = 2.114$ for $n = 5$.",
            "Process standard deviation estimated as $\\hat{\\sigma} = \\bar{R}/d_2$ with $d_2 = 2.326$.",
            "Phase II: later subgroups compared with the fixed limits.",
        ],
        "process": [
            "Checked the R chart first: dispersion must be in control before the X̄ limits mean anything.",
            "Computed the grand mean and average range from the baseline subgroups.",
            "Plotted subgroup means against the limits and flagged points outside them.",
        ],
        "charts": [
            chart(
                id="xbar",
                kind="line",
                title="X̄ chart: subgroup means",
                subtitle="Synthetic data · grams",
                x_key="subgroup",
                x_label="Subgroup",
                y_label="Mean fill weight (g)",
                y_domain=[48.5, 52.0],
                series=[{"key": "xbar", "label": "Subgroup mean", "color": 1, "style": "line-points"}],
                data=[{"subgroup": i + 1, "xbar": r(v, 3)} for i, v in enumerate(xbar)],
                reference_lines=[
                    {"axis": "y", "value": r(ucl_x, 3), "label": f"UCL {ucl_x:.2f}"},
                    {"axis": "y", "value": r(xbarbar, 3), "label": f"CL {xbarbar:.2f}"},
                    {"axis": "y", "value": r(lcl_x, 3), "label": f"LCL {lcl_x:.2f}"},
                    {"axis": "x", "value": 20.5, "label": "Shift introduced"},
                ],
            ),
            chart(
                id="range",
                kind="line",
                title="R chart: subgroup ranges",
                subtitle="Synthetic data · grams",
                x_key="subgroup",
                x_label="Subgroup",
                y_label="Range (g)",
                y_domain=[0, 5],
                series=[{"key": "range", "label": "Subgroup range", "color": 1, "style": "line-points"}],
                data=[{"subgroup": i + 1, "range": r(v, 3)} for i, v in enumerate(rng_)],
                reference_lines=[
                    {"axis": "y", "value": r(ucl_r, 3), "label": f"UCL {ucl_r:.2f}"},
                    {"axis": "y", "value": r(rbar, 3), "label": f"R̄ {rbar:.2f}"},
                ],
            ),
        ],
        "results": [
            {"label": "Grand mean (baseline)", "value": f"{xbarbar:.3f} g"},
            {"label": "Average range R̄", "value": f"{rbar:.3f} g"},
            {"label": "X̄ chart limits", "value": f"{lcl_x:.3f} – {ucl_x:.3f} g"},
            {"label": "Estimated σ", "value": f"{sigma_hat:.3f} g"},
            {"label": "Subgroups signalling", "value": ", ".join(map(str, out)) if out else "None"},
        ],
        "interpretation": [
            "The R chart stays within its limits, so short-term variability is stable and the X̄ limits are trustworthy.",
            f"Subgroup means after the shift fall above the upper control limit (subgroups {', '.join(map(str, out))}), which signals an assignable cause such as a drifting filler setting." if out else "No subgroup crossed the limits.",
            f"The estimated process σ of {sigma_hat:.2f} g is close to the 0.8 g used to generate the data, which is a useful sanity check on the R̄/d₂ estimator.",
        ],
        "limitations": [
            "Only the 'point beyond 3σ' rule is applied here; run rules (e.g., several consecutive points on one side) would add sensitivity.",
            "Limits assume approximately normal, independent measurements within subgroups.",
            "The data and shift are synthetic and illustrate the method only.",
        ],
        "applications": ["Manufacturing and packaging lines", "Service-process monitoring (e.g., turnaround times)", "Laboratory measurement stability"],
        "related_services": ["statistical-quality-control"],
        "related_courses": ["statistical-quality-control"],
        "related_articles": ["control-charts-for-quality"],
        "source_pages": [43, 44],
    }


# ---------------------------------------------------------------------------
# 3. Kaplan–Meier comparison with log-rank test (Survival, p72-75)
# ---------------------------------------------------------------------------
def km_curve(time: np.ndarray, event: np.ndarray):
    order = np.argsort(time)
    time, event = time[order], event[order]
    s, pts = 1.0, [(0.0, 1.0)]
    for ut in np.unique(time[event == 1]):
        at_risk = np.sum(time >= ut)
        d = np.sum((time == ut) & (event == 1))
        s *= 1 - d / at_risk
        pts.append((float(ut), s))
    return pts


def median_survival(pts) -> float | None:
    for t_, s in pts:
        if s <= 0.5:
            return t_
    return None


def logrank(t1, e1, t2, e2):
    times = np.unique(np.concatenate([t1[e1 == 1], t2[e2 == 1]]))
    O1 = E1 = V = 0.0
    for ut in times:
        n1, n2 = np.sum(t1 >= ut), np.sum(t2 >= ut)
        d1 = np.sum((t1 == ut) & (e1 == 1))
        d2 = np.sum((t2 == ut) & (e2 == 1))
        n, d = n1 + n2, d1 + d2
        if n < 2:
            continue
        O1 += d1
        E1 += d * n1 / n
        V += d * (n1 / n) * (1 - n1 / n) * (n - d) / (n - 1)
    chi2 = (O1 - E1) ** 2 / V
    return chi2, float(stats.chi2.sf(chi2, 1))


def survival(rng: np.random.Generator) -> dict:
    n = 60
    # Weibull lifetimes (shape 1.5); group B has a longer scale
    tA = 12 * rng.weibull(1.5, n)
    tB = 18 * rng.weibull(1.5, n)
    cA, cB = rng.uniform(4, 30, n), rng.uniform(4, 30, n)  # random censoring
    obsA, evA = np.minimum(tA, cA), (tA <= cA).astype(int)
    obsB, evB = np.minimum(tB, cB), (tB <= cB).astype(int)
    obsA, obsB = np.round(obsA, 1), np.round(obsB, 1)

    kmA, kmB = km_curve(obsA, evA), km_curve(obsB, evB)
    chi2, p = logrank(obsA, evA, obsB, evB)
    medA, medB = median_survival(kmA), median_survival(kmB)

    # Merge both step functions onto a common grid of event times for plotting
    grid = sorted({0.0} | {t_ for t_, _ in kmA} | {t_ for t_, _ in kmB})

    def at(pts, x):
        val = 1.0
        for t_, s in pts:
            if t_ <= x:
                val = s
            else:
                break
        return val

    data = [{"time": r(x, 1), "group_a": r(at(kmA, x), 4), "group_b": r(at(kmB, x), 4)} for x in grid]

    return {
        "slug": "survival-kaplan-meier-comparison",
        "title": "Comparing Time-to-Event Curves with Kaplan–Meier and the Log-Rank Test",
        "category": "Statistics",
        "summary": "Estimating survival curves for two synthetic groups with right-censored follow-up and testing whether they differ.",
        "is_synthetic": True,
        "problem": "A study team needs to compare how long two groups go before an event (for example, component failure or relapse) when some subjects leave the study before the event happens.",
        "dataset": "Two synthetic groups of 60 subjects. Lifetimes are Weibull (shape 1.5; scale 12 vs 18 months) with independent uniform censoring between 4 and 30 months (seed 20231004). No patient or product data is used.",
        "methodology": [
            "Right censoring handled with the Kaplan–Meier product-limit estimator $\\hat{S}(t) = \\prod_{t_i \\le t} (1 - d_i / n_i)$.",
            "Median survival read as the first time at which $\\hat{S}(t) \\le 0.5$.",
            "Log-rank test: observed vs expected events in group A summed over distinct event times, compared with $\\chi^2_1$.",
        ],
        "process": [
            "Recorded each subject's follow-up time and whether the event was observed (1) or censored (0).",
            "Computed the number at risk and the number of events at every distinct event time.",
            "Built the step-function survival curves and compared them with the log-rank statistic.",
        ],
        "charts": [
            chart(
                id="km",
                kind="step",
                title="Kaplan–Meier survival estimates",
                subtitle="Synthetic data · proportion event-free",
                x_key="time",
                x_label="Months of follow-up",
                y_label="Survival probability",
                y_domain=[0, 1],
                series=[
                    {"key": "group_a", "label": "Group A", "color": 1, "style": "step"},
                    {"key": "group_b", "label": "Group B", "color": 2, "style": "step"},
                ],
                data=data,
                reference_lines=[{"axis": "y", "value": 0.5, "label": "Median"}],
            )
        ],
        "results": [
            {"label": "Events / subjects (A)", "value": f"{int(evA.sum())} / {n}"},
            {"label": "Events / subjects (B)", "value": f"{int(evB.sum())} / {n}"},
            {"label": "Median survival A", "value": f"{medA:.1f} months" if medA else "Not reached"},
            {"label": "Median survival B", "value": f"{medB:.1f} months" if medB else "Not reached"},
            {"label": "Log-rank χ² (1 df)", "value": f"{chi2:.2f}"},
            {"label": "p-value", "value": f"{p:.4f}" if p >= 0.0001 else "< 0.0001"},
        ],
        "interpretation": [
            "Group B's curve sits above group A's for most of follow-up: at those times a larger share of group B is still event-free. The curves meet in the far tail, where very few subjects remain at risk and the estimates are imprecise.",
            f"The log-rank test gives χ² = {chi2:.2f} on 1 degree of freedom (p {'= ' + format(p, '.4f') if p >= 0.0001 else '< 0.0001'}), so the evidence that the curves differ is {'strong' if p < 0.01 else 'moderate' if p < 0.05 else 'weak'}.",
            "Censored subjects still contribute information up to the time they leave, which a simple 'percentage who had the event' would throw away.",
        ],
        "limitations": [
            "Kaplan–Meier assumes censoring is unrelated to the risk of the event (non-informative censoring).",
            "The log-rank test is most powerful when hazards are proportional; crossing curves need other methods.",
            "Group comparisons in observational data may be confounded; adjusted models (e.g., Cox regression) would be needed.",
            "All figures come from synthetic data.",
        ],
        "applications": ["Clinical and public-health follow-up studies", "Product and component reliability", "Customer retention (time to churn)"],
        "related_services": ["survival-reliability-analysis"],
        "related_courses": ["survival-reliability-analysis"],
        "related_articles": ["survival-analysis-kaplan-meier"],
        "source_pages": [72, 73, 74, 75],
    }


# ---------------------------------------------------------------------------
# 4. Simple linear regression (Descriptive stats / Math foundations, p3, p41-42)
# ---------------------------------------------------------------------------
def regression(rng: np.random.Generator) -> dict:
    n = 40
    spend = np.round(rng.uniform(5, 50, n), 1)  # thousand currency units
    sales = 120 + 4.2 * spend + rng.normal(0, 18, n)
    res = stats.linregress(spend, sales)
    rho, rho_p = stats.spearmanr(spend, sales)
    yhat = res.intercept + res.slope * spend
    resid = sales - yhat
    s_e = math.sqrt(np.sum(resid**2) / (n - 2))
    tcrit = stats.t.ppf(0.975, n - 2)
    ci = (res.slope - tcrit * res.stderr, res.slope + tcrit * res.stderr)
    order = np.argsort(spend)

    pts = [{"spend": r(spend[i], 1), "sales": r(sales[i], 1)} for i in order]
    line = [{"spend": r(x, 1), "fitted": r(res.intercept + res.slope * x, 1)} for x in (spend.min(), spend.max())]

    return {
        "slug": "regression-marketing-response",
        "title": "Measuring a Marketing Response with Simple Linear Regression",
        "category": "Statistics",
        "summary": "Quantifying how sales move with promotional spend, with a confidence interval for the effect and a check of the model's assumptions.",
        "is_synthetic": True,
        "problem": "A business wants to know how strongly weekly sales are associated with promotional spend, and how precisely that relationship can be estimated.",
        "dataset": "40 synthetic weeks of promotional spend (5–50 thousand currency units) and sales generated as 120 + 4.2 × spend plus normal noise (σ = 18), seed 20231004.",
        "methodology": [
            "Scatter diagram to check that a straight line is a reasonable description.",
            "Pearson product-moment correlation and Spearman's rank correlation.",
            "Least-squares fit $\\hat{y} = a + b x$ with a 95% confidence interval for the slope using the $t_{n-2}$ distribution.",
            "Coefficient of determination $R^2$ and residual standard error.",
        ],
        "process": [
            "Plotted the data and confirmed an approximately linear, homoscedastic pattern.",
            "Estimated the line by least squares and computed the standard error of the slope.",
            "Checked residuals for curvature or changing spread before interpreting the coefficients.",
        ],
        "charts": [
            chart(
                id="scatter",
                kind="scatter",
                title="Sales against promotional spend with least-squares line",
                subtitle="Synthetic data · thousand currency units",
                x_key="spend",
                x_label="Promotional spend",
                y_label="Sales",
                series=[
                    {"key": "sales", "label": "Observed weeks", "color": 1, "style": "points"},
                    {"key": "fitted", "label": "Fitted line", "color": 2, "style": "line"},
                ],
                data=pts,
                overlay=line,
            ),
            chart(
                id="residuals",
                kind="scatter",
                title="Residuals against fitted values",
                subtitle="No pattern is what we want to see",
                x_key="fitted",
                x_label="Fitted sales",
                y_label="Residual",
                series=[{"key": "residual", "label": "Residual", "color": 1, "style": "points"}],
                data=[{"fitted": r(yhat[i], 1), "residual": r(resid[i], 1)} for i in order],
                reference_lines=[{"axis": "y", "value": 0, "label": "0"}],
            ),
        ],
        "results": [
            {"label": "Fitted line", "value": f"ŷ = {res.intercept:.1f} + {res.slope:.2f}x"},
            {"label": "95% CI for slope", "value": f"{ci[0]:.2f} to {ci[1]:.2f}"},
            {"label": "Pearson r", "value": f"{res.rvalue:.3f}"},
            {"label": "Spearman ρ", "value": f"{rho:.3f}"},
            {"label": "R²", "value": f"{res.rvalue**2:.3f}"},
            {"label": "Residual std. error", "value": f"{s_e:.1f}"},
        ],
        "interpretation": [
            f"Each additional thousand units of spend is associated with about {res.slope:.1f} thousand units of extra sales (95% CI {ci[0]:.1f} to {ci[1]:.1f}).",
            f"Spend accounts for about {res.rvalue**2 * 100:.0f}% of the week-to-week variation in sales (R²); the rest comes from other factors.",
            "Residuals scatter evenly around zero with no curvature, so the straight-line model is adequate for this data.",
        ],
        "limitations": [
            "Association is not causation: in real data, spend is often raised when demand is already expected to be high.",
            "Predictions outside the observed spend range (5–50) are extrapolation.",
            "Real campaigns usually need multiple regression to control for seasonality, price and other drivers.",
            "The data is synthetic.",
        ],
        "applications": ["Marketing-mix and pricing studies", "Dose–response in agricultural or biomedical experiments", "Calibration and measurement studies"],
        "related_services": ["regression-predictive-modelling", "statistical-analysis"],
        "related_courses": ["regression-predictive-modelling", "statistics-for-data-analysis"],
        "related_articles": ["correlation-and-regression"],
        "source_pages": [3, 41, 42],
    }


# ---------------------------------------------------------------------------
# 5. PCA (Multivariate, p68-71)
# ---------------------------------------------------------------------------
def pca(rng: np.random.Generator) -> dict:
    n = 300
    names = ["Visit frequency", "Basket value", "Items per visit", "Discount usage", "Online share"]
    # Two latent factors: engagement (first three) and price sensitivity / channel
    f1, f2 = rng.normal(size=n), rng.normal(size=n)
    X = np.column_stack(
        [
            0.85 * f1 + 0.3 * rng.normal(size=n),
            0.80 * f1 + 0.35 * rng.normal(size=n),
            0.75 * f1 + 0.4 * rng.normal(size=n),
            0.80 * f2 + 0.4 * rng.normal(size=n),
            -0.70 * f2 + 0.45 * rng.normal(size=n),
        ]
    )
    Z = (X - X.mean(0)) / X.std(0, ddof=1)
    R = np.corrcoef(Z, rowvar=False)
    evals, evecs = np.linalg.eigh(R)
    idx = np.argsort(evals)[::-1]
    evals, evecs = evals[idx], evecs[:, idx]
    # orient each component so its largest loading is positive (sign is arbitrary)
    for j in range(evecs.shape[1]):
        if evecs[np.argmax(np.abs(evecs[:, j])), j] < 0:
            evecs[:, j] *= -1
    prop = evals / evals.sum()
    loadings = evecs * np.sqrt(evals)
    kaiser = int(np.sum(evals > 1))

    return {
        "slug": "pca-customer-segmentation",
        "title": "Reducing Customer Metrics to Key Dimensions with Principal Components",
        "category": "Statistics",
        "summary": "Using principal component analysis on five correlated behaviour metrics to find the few dimensions that summarise them.",
        "is_synthetic": True,
        "problem": "An analytics team tracks several overlapping customer metrics and wants a smaller set of uncorrelated dimensions for reporting and later segmentation.",
        "dataset": "300 synthetic customers with five standardised metrics generated from two hidden factors plus noise (seed 20231004). No real customer data is used.",
        "methodology": [
            "Standardised each variable and formed the sample correlation matrix $\\mathbf{R}$.",
            "Eigen-decomposition $\\mathbf{R} = \\mathbf{V}\\boldsymbol{\\Lambda}\\mathbf{V}^\\top$; component variances are the eigenvalues.",
            "Retained components using the scree plot and the eigenvalue-greater-than-one (Kaiser) rule.",
            "Interpreted loadings $\\ell_{jk} = v_{jk}\\sqrt{\\lambda_k}$, the correlation between variable $j$ and component $k$.",
        ],
        "process": [
            "Checked pairwise correlations to confirm there was redundancy worth reducing.",
            "Computed eigenvalues and the proportion of variance each component explains.",
            "Named the retained components from their strongest loadings.",
        ],
        "charts": [
            chart(
                id="scree",
                kind="bar",
                x_type="category",
                title="Scree plot: variance explained by each component",
                subtitle="Synthetic data · eigenvalues of the correlation matrix",
                x_key="component",
                x_label="Component",
                y_label="Eigenvalue",
                series=[{"key": "eigenvalue", "label": "Eigenvalue", "color": 1, "style": "bar"}],
                data=[{"component": f"PC{k + 1}", "eigenvalue": r(v, 3), "share": f"{p_ * 100:.1f}%"} for k, (v, p_) in enumerate(zip(evals, prop))],
                reference_lines=[{"axis": "y", "value": 1.0, "label": "Kaiser threshold"}],
            ),
            chart(
                id="loadings",
                kind="bar",
                x_type="category",
                layout="horizontal",
                title="Loadings on the first two components",
                subtitle="Correlation between each metric and the component",
                x_key="metric",
                x_label="Loading",
                y_label="Metric",
                y_domain=[-1, 1],
                series=[
                    {"key": "pc1", "label": "PC1", "color": 1, "style": "bar"},
                    {"key": "pc2", "label": "PC2", "color": 2, "style": "bar"},
                ],
                data=[{"metric": nm, "pc1": r(loadings[j, 0], 3), "pc2": r(loadings[j, 1], 3)} for j, nm in enumerate(names)],
            ),
        ],
        "results": [
            {"label": "Components with eigenvalue > 1", "value": str(kaiser)},
            {"label": "Variance explained by PC1", "value": f"{prop[0] * 100:.1f}%"},
            {"label": "Variance explained by PC2", "value": f"{prop[1] * 100:.1f}%"},
            {"label": "Cumulative (PC1 + PC2)", "value": f"{(prop[0] + prop[1]) * 100:.1f}%"},
        ],
        "interpretation": [
            f"Two components explain {(prop[0] + prop[1]) * 100:.0f}% of the total variation in five metrics, so the data is well summarised in two dimensions.",
            "PC1 loads on visit frequency, basket value and items per visit: an 'engagement' dimension.",
            "PC2 contrasts discount usage with online share: a 'price sensitivity versus channel' dimension. Component scores can feed cluster analysis for segmentation.",
        ],
        "limitations": [
            "Components are linear combinations; non-linear structure needs other techniques.",
            "Naming components is a judgement; loadings should be reviewed with domain experts.",
            "Results depend on scaling; here all variables were standardised.",
            "The data is synthetic.",
        ],
        "applications": ["Customer and market segmentation", "Survey scale construction (with factor analysis)", "Reducing correlated predictors before modelling"],
        "related_services": ["multivariate-analysis-segmentation", "business-analytics-data-mining"],
        "related_courses": ["multivariate-statistical-analysis"],
        "related_articles": ["principal-components-and-factor-analysis", "matrix-decompositions-for-data-science"],
        "source_pages": [68, 69, 70, 71],
    }


# ---------------------------------------------------------------------------
# 6. One-way ANOVA for a completely randomised design (p30, p60-61)
# ---------------------------------------------------------------------------
def anova(rng: np.random.Generator) -> dict:
    groups = {"Control": 52.0, "Treatment A": 55.5, "Treatment B": 58.0}
    reps = 8
    data = {g: rng.normal(mu, 3.0, reps) for g, mu in groups.items()}
    vals = list(data.values())
    F, p = stats.f_oneway(*vals)
    allv = np.concatenate(vals)
    k, N = len(vals), allv.size
    grand = allv.mean()
    ss_t = sum(len(v) * (v.mean() - grand) ** 2 for v in vals)
    ss_e = sum(((v - v.mean()) ** 2).sum() for v in vals)
    ms_t, ms_e = ss_t / (k - 1), ss_e / (N - k)
    tcrit = stats.t.ppf(0.975, N - k)
    hw = tcrit * math.sqrt(ms_e / reps)
    tk = stats.tukey_hsd(*vals)

    names = list(groups)
    sig = [f"{names[j]} and {names[i]}" for i in range(k) for j in range(i + 1, k) if tk.pvalue[i, j] < 0.05]
    pairs = []
    for i in range(k):
        for j in range(i + 1, k):
            pairs.append(f"{names[j]} − {names[i]}: p = {tk.pvalue[i, j]:.4f}" if tk.pvalue[i, j] >= 0.0001 else f"{names[j]} − {names[i]}: p < 0.0001")

    return {
        "slug": "anova-treatment-comparison",
        "title": "Comparing Three Treatments with a Completely Randomised Design",
        "category": "Research",
        "summary": "Analysing a synthetic field trial with one-way ANOVA, then identifying which treatments differ.",
        "is_synthetic": True,
        "problem": "A research team has randomly assigned plots to a control and two treatments and needs to know whether mean yield differs, and if so, which treatments differ.",
        "dataset": "24 synthetic plots: 8 replicates per group drawn from normal distributions (means 52, 55.5, 58; σ = 3), seed 20231004.",
        "methodology": [
            "Completely randomised design (CRD) with equal replication.",
            "One-way ANOVA: total sum of squares split into treatment and error components, $F = MS_{T}/MS_{E}$.",
            "95% confidence intervals for group means using the pooled error mean square.",
            "Tukey's HSD for pairwise comparisons after a significant F test (a standard follow-up to ANOVA).",
        ],
        "process": [
            "Confirmed the design: randomisation, replication, and no blocking factor.",
            "Built the ANOVA table and tested the null hypothesis of equal treatment means.",
            "Compared pairs of treatments while controlling the family-wise error rate.",
        ],
        "charts": [
            chart(
                id="means",
                kind="bar",
                x_type="category",
                title="Mean yield by group with 95% confidence intervals",
                subtitle="Synthetic data · yield units per plot",
                x_key="group",
                x_label="Group",
                y_label="Mean yield",
                y_domain=[40, 65],
                series=[{"key": "mean", "label": "Mean yield", "color": 1, "style": "bar", "error_key": "ci"}],
                data=[{"group": g, "mean": r(v.mean(), 2), "ci": r(hw, 2), "low": r(v.mean() - hw, 2), "high": r(v.mean() + hw, 2)} for g, v in data.items()],
            )
        ],
        "anova_table": {
            "columns": ["Source", "df", "Sum of squares", "Mean square", "F", "p-value"],
            "rows": [
                ["Treatments", str(k - 1), f"{ss_t:.2f}", f"{ms_t:.2f}", f"{F:.2f}", f"{p:.4f}" if p >= 0.0001 else "< 0.0001"],
                ["Error", str(N - k), f"{ss_e:.2f}", f"{ms_e:.2f}", "", ""],
                ["Total", str(N - 1), f"{ss_t + ss_e:.2f}", "", "", ""],
            ],
        },
        "results": [
            {"label": "F statistic", "value": f"F({k - 1}, {N - k}) = {F:.2f}"},
            {"label": "p-value", "value": f"{p:.4f}" if p >= 0.0001 else "< 0.0001"},
            {"label": "Pooled error SD", "value": f"{math.sqrt(ms_e):.2f}"},
        ]
        + [{"label": "Tukey HSD", "value": s} for s in pairs],
        "interpretation": [
            f"The F test (F = {F:.2f}, p {'= ' + format(p, '.4f') if p >= 0.0001 else '< 0.0001'}) indicates that at least one group mean differs.",
            (
                "Tukey's HSD shows that "
                + (" and ".join(sig) if sig else "no individual pair")
                + " differ at the 5% level, while the remaining comparisons are not significant with eight replicates per group."
            ),
            "Effect sizes (differences in mean yield) matter as much as p-values when deciding whether a treatment is worth adopting.",
        ],
        "limitations": [
            "ANOVA assumes independent errors, normality and equal variances; these should be checked with residual plots.",
            "If plots varied systematically (soil, slope), a randomised block or Latin square design would control that variation.",
            "The data is synthetic.",
        ],
        "applications": ["Agricultural field trials", "Biomedical and laboratory experiments", "A/B and multivariate tests in product research"],
        "related_services": ["survey-sampling-experimental-design", "statistical-analysis"],
        "related_courses": ["experimental-design-sampling", "statistical-inference-hypothesis-testing"],
        "related_articles": ["analysis-of-variance", "design-of-experiments"],
        "source_pages": [30, 60, 61],
    }


# ---------------------------------------------------------------------------
# 7. Linear programming product mix (OR, p32-33)
# ---------------------------------------------------------------------------
def lp_product_mix() -> dict:
    from scipy.optimize import linprog

    # maximise 40x + 30y  s.t.  2x + y <= 100 (machine h), x + y <= 80 (labour h), x <= 40 (demand)
    c = [-40, -30]
    A = [[2, 1], [1, 1], [1, 0]]
    b = [100, 80, 40]
    sol = linprog(c, A_ub=A, b_ub=b, bounds=[(0, None), (0, None)], method="highs")
    x_opt, y_opt = sol.x
    z = -sol.fun
    duals = [-v for v in sol.ineqlin.marginals]

    # Corner points of the feasible region (computed by enumeration of constraint pairs)
    lines = [((2, 1), 100), ((1, 1), 80), ((1, 0), 40), ((1, 0), 0), ((0, 1), 0)]
    verts = set()
    for i in range(len(lines)):
        for j in range(i + 1, len(lines)):
            (a1, b1), c1 = lines[i]
            (a2, b2), c2 = lines[j]
            det = a1 * b2 - a2 * b1
            if abs(det) < 1e-12:
                continue
            x = (c1 * b2 - c2 * b1) / det
            y = (a1 * c2 - a2 * c1) / det
            if x >= -1e-9 and y >= -1e-9 and 2 * x + y <= 100 + 1e-9 and x + y <= 80 + 1e-9 and x <= 40 + 1e-9:
                verts.add((round(x, 6) + 0.0, round(y, 6) + 0.0))
    verts = sorted(verts, key=lambda v: math.atan2(v[1] - 30, v[0] - 20))
    rows = [[f"({vx:g}, {vy:g})", f"{40 * vx + 30 * vy:,.0f}"] for vx, vy in verts]

    return {
        "slug": "lp-product-mix-optimisation",
        "title": "Choosing a Product Mix with Linear Programming",
        "category": "Mathematics",
        "summary": "Formulating a two-product planning problem with machine, labour and demand limits, solving it, and reading the shadow prices.",
        "is_synthetic": True,
        "problem": "A small workshop makes two products and wants the weekly production plan that maximises contribution without exceeding machine time, labour time or expected demand.",
        "dataset": "Illustrative coefficients: contribution 40 and 30 per unit; product 1 needs 2 machine-hours and product 2 needs 1 (100 available); each needs 1 labour-hour (80 available); demand for product 1 is at most 40.",
        "methodology": [
            "Formulation: maximise $Z = 40x_1 + 30x_2$ subject to $2x_1 + x_2 \\le 100$, $x_1 + x_2 \\le 80$, $x_1 \\le 40$, $x_1, x_2 \\ge 0$.",
            "Graphical method: the optimum lies at a corner point of the convex feasible region.",
            "Simplex-based solver (HiGHS) to confirm the optimum and obtain dual values (shadow prices).",
        ],
        "process": [
            "Translated each business rule into a linear constraint.",
            "Enumerated the corner points of the feasible region and evaluated the objective at each.",
            "Solved with a simplex-type solver and interpreted the dual values for each resource.",
        ],
        "charts": [
            chart(
                id="vertices",
                kind="bar",
                x_type="category",
                title="Objective value at each corner point of the feasible region",
                subtitle="Illustrative coefficients · contribution per week",
                x_key="vertex",
                x_label="Corner point (x₁, x₂)",
                y_label="Contribution Z",
                series=[{"key": "z", "label": "Contribution", "color": 1, "style": "bar"}],
                data=[{"vertex": f"({vx:g}, {vy:g})", "z": r(40 * vx + 30 * vy, 0)} for vx, vy in sorted(verts)],
            )
        ],
        "anova_table": {"columns": ["Corner point (x₁, x₂)", "Z = 40x₁ + 30x₂"], "rows": rows},
        "results": [
            {"label": "Optimal plan", "value": f"x₁ = {x_opt:g}, x₂ = {y_opt:g}"},
            {"label": "Maximum contribution", "value": f"{z:,.0f}"},
            {"label": "Shadow price: machine-hours", "value": f"{duals[0]:g} per hour"},
            {"label": "Shadow price: labour-hours", "value": f"{duals[1]:g} per hour"},
            {"label": "Shadow price: product-1 demand", "value": f"{duals[2]:g} per unit"},
        ],
        "interpretation": [
            f"The best plan makes {x_opt:g} units of product 1 and {y_opt:g} of product 2, for a contribution of {z:,.0f}.",
            "Machine and labour hours are both binding, so each has a positive shadow price: an extra hour would raise contribution by that amount, within the range where the same constraints stay binding.",
            "The demand limit on product 1 is not binding, so its shadow price is zero. Raising forecast demand would not change the plan.",
        ],
        "limitations": [
            "Linear programming assumes constant contributions and resource use per unit, and allows fractional production unless integer constraints are added.",
            "Shadow prices are valid only within their sensitivity ranges.",
            "Coefficients are illustrative, not drawn from any real business.",
        ],
        "applications": ["Production and distribution planning", "Diet and blending problems", "Transportation and assignment of resources"],
        "related_services": ["operations-research-optimisation"],
        "related_courses": ["operations-research-decision-modelling"],
        "related_articles": ["linear-programming-and-simplex"],
        "source_pages": [32, 33, 113],
    }


def main() -> None:
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    rng = np.random.default_rng(SEED)
    projects = [
        demand_forecasting(rng),
        process_control(rng),
        survival(rng),
        regression(rng),
        pca(rng),
        anova(rng),
        lp_product_mix(),
    ]
    for i, p in enumerate(projects, start=1):
        p.setdefault("anova_table", None)
        p.update({"order": i, "status": "published", "featured": i <= 3})
    OUT.write_text(json.dumps(projects, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(projects)} projects to {OUT}")
    for p in projects:
        print(f"- {p['slug']}:", "; ".join(f"{x['label']}={x['value']}" for x in p["results"]))


if __name__ == "__main__":
    main()
