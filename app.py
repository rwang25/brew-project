import sqlite3
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import streamlit as st

DB_PATH = Path(__file__).with_name("brews.db")

STATUS_OPTIONS = [
    "Planning",
    "Primary fermentation",
    "Secondary fermentation",
    "Conditioning",
    "Bottled",
    "Completed",
    "Discarded",
]

BREW_TYPES = [
    "Mead",
    "Beer",
    "Cider",
    "Wine",
    "Kombucha",
    "Other",
]


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS brews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                brew_type TEXT NOT NULL,
                style TEXT,
                batch_size REAL,
                batch_size_unit TEXT DEFAULT 'gal',
                start_date TEXT NOT NULL,
                rack_date TEXT,
                bottle_date TEXT,
                expected_ready_date TEXT,
                status TEXT NOT NULL,
                original_gravity REAL,
                final_gravity REAL,
                target_abv REAL,
                calculated_abv REAL,
                yeast TEXT,
                temperature REAL,
                temperature_unit TEXT DEFAULT '°F',
                vessel TEXT,
                tasting_notes TEXT,
                process_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brew_id INTEGER NOT NULL,
                ingredient_name TEXT NOT NULL,
                amount REAL,
                unit TEXT,
                category TEXT,
                notes TEXT,
                FOREIGN KEY (brew_id) REFERENCES brews(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS gravity_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brew_id INTEGER NOT NULL,
                reading_date TEXT NOT NULL,
                specific_gravity REAL NOT NULL,
                temperature REAL,
                temperature_unit TEXT DEFAULT '°F',
                notes TEXT,
                FOREIGN KEY (brew_id) REFERENCES brews(id) ON DELETE CASCADE
            );
            """
        )


def calculate_abv(original_gravity: float | None, final_gravity: float | None) -> float | None:
    if original_gravity is None or final_gravity is None:
        return None
    return max(0.0, (original_gravity - final_gravity) * 131.25)


def normalize_optional_number(value: float) -> float | None:
    return None if value == 0 else float(value)


def load_brews() -> pd.DataFrame:
    with get_connection() as conn:
        return pd.read_sql_query(
            """
            SELECT
                id,
                name,
                brew_type,
                style,
                batch_size,
                batch_size_unit,
                start_date,
                rack_date,
                bottle_date,
                expected_ready_date,
                status,
                original_gravity,
                final_gravity,
                target_abv,
                calculated_abv,
                yeast,
                vessel,
                temperature,
                temperature_unit,
                tasting_notes,
                process_notes,
                created_at,
                updated_at
            FROM brews
            ORDER BY start_date DESC, id DESC
            """,
            conn,
        )


def get_brew(brew_id: int) -> sqlite3.Row | None:
    with get_connection() as conn:
        return conn.execute("SELECT * FROM brews WHERE id = ?", (brew_id,)).fetchone()


def get_ingredients(brew_id: int) -> pd.DataFrame:
    with get_connection() as conn:
        return pd.read_sql_query(
            """
            SELECT id, ingredient_name, amount, unit, category, notes
            FROM ingredients
            WHERE brew_id = ?
            ORDER BY id
            """,
            conn,
            params=(brew_id,),
        )


def get_gravity_readings(brew_id: int) -> pd.DataFrame:
    with get_connection() as conn:
        return pd.read_sql_query(
            """
            SELECT id, reading_date, specific_gravity, temperature, temperature_unit, notes
            FROM gravity_readings
            WHERE brew_id = ?
            ORDER BY reading_date, id
            """,
            conn,
            params=(brew_id,),
        )


def add_brew(
    name: str,
    brew_type: str,
    style: str,
    batch_size: float | None,
    batch_size_unit: str,
    start_date: date,
    status: str,
    original_gravity: float | None,
    target_abv: float | None,
    yeast: str,
    temperature: float | None,
    temperature_unit: str,
    vessel: str,
    process_notes: str,
) -> int:
    now = datetime.now().isoformat(timespec="seconds")
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO brews (
                name, brew_type, style, batch_size, batch_size_unit,
                start_date, status, original_gravity, target_abv,
                calculated_abv, yeast, temperature, temperature_unit,
                vessel, process_notes, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name.strip(),
                brew_type,
                style.strip(),
                batch_size,
                batch_size_unit,
                start_date.isoformat(),
                status,
                original_gravity,
                target_abv,
                None,
                yeast.strip(),
                temperature,
                temperature_unit,
                vessel.strip(),
                process_notes.strip(),
                now,
                now,
            ),
        )
        return int(cursor.lastrowid)


def update_brew(
    brew_id: int,
    name: str,
    brew_type: str,
    style: str,
    batch_size: float | None,
    batch_size_unit: str,
    start_date: date,
    status: str,
    original_gravity: float | None,
    target_abv: float | None,
    yeast: str,
    vessel: str,
    temperature: float | None,
    temperature_unit: str,
    rack_date: date | None,
    bottle_date: date | None,
    expected_ready_date: date | None,
    final_gravity: float | None,
    tasting_notes: str,
    process_notes: str,
) -> None:
    calculated_abv = calculate_abv(original_gravity, final_gravity)
    now = datetime.now().isoformat(timespec="seconds")

    with get_connection() as conn:
        conn.execute(
            """
            UPDATE brews
            SET name = ?,
                brew_type = ?,
                style = ?,
                batch_size = ?,
                batch_size_unit = ?,
                start_date = ?,
                status = ?,
                original_gravity = ?,
                target_abv = ?,
                yeast = ?,
                vessel = ?,
                temperature = ?,
                temperature_unit = ?,
                rack_date = ?,
                bottle_date = ?,
                expected_ready_date = ?,
                final_gravity = ?,
                calculated_abv = ?,
                tasting_notes = ?,
                process_notes = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                name.strip(),
                brew_type,
                style.strip(),
                batch_size,
                batch_size_unit,
                start_date.isoformat(),
                status,
                original_gravity,
                target_abv,
                yeast.strip(),
                vessel.strip(),
                temperature,
                temperature_unit,
                rack_date.isoformat() if rack_date else None,
                bottle_date.isoformat() if bottle_date else None,
                expected_ready_date.isoformat() if expected_ready_date else None,
                final_gravity,
                calculated_abv,
                tasting_notes.strip(),
                process_notes.strip(),
                now,
                brew_id,
            ),
        )


def add_ingredient(
    brew_id: int,
    ingredient_name: str,
    amount: float | None,
    unit: str,
    category: str,
    notes: str,
) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO ingredients (
                brew_id, ingredient_name, amount, unit, category, notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                brew_id,
                ingredient_name.strip(),
                amount,
                unit.strip(),
                category,
                notes.strip(),
            ),
        )


def delete_ingredient(ingredient_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM ingredients WHERE id = ?", (ingredient_id,))


def add_gravity_reading(
    brew_id: int,
    reading_date: date,
    specific_gravity: float,
    temperature: float | None,
    temperature_unit: str,
    notes: str,
) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO gravity_readings (
                brew_id, reading_date, specific_gravity,
                temperature, temperature_unit, notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                brew_id,
                reading_date.isoformat(),
                specific_gravity,
                temperature,
                temperature_unit,
                notes.strip(),
            ),
        )

        latest = conn.execute(
            """
            SELECT specific_gravity
            FROM gravity_readings
            WHERE brew_id = ?
            ORDER BY reading_date DESC, id DESC
            LIMIT 1
            """,
            (brew_id,),
        ).fetchone()

        if latest:
            conn.execute(
                """
                UPDATE brews
                SET final_gravity = ?,
                    calculated_abv = CASE
                        WHEN original_gravity IS NOT NULL
                        THEN MAX(0, (original_gravity - ?) * 131.25)
                        ELSE calculated_abv
                    END,
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    latest["specific_gravity"],
                    latest["specific_gravity"],
                    datetime.now().isoformat(timespec="seconds"),
                    brew_id,
                ),
            )


def delete_gravity_reading(reading_id: int) -> None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT brew_id FROM gravity_readings WHERE id = ?", (reading_id,)
        ).fetchone()
        if not row:
            return

        brew_id = row["brew_id"]
        conn.execute("DELETE FROM gravity_readings WHERE id = ?", (reading_id,))

        latest = conn.execute(
            """
            SELECT specific_gravity
            FROM gravity_readings
            WHERE brew_id = ?
            ORDER BY reading_date DESC, id DESC
            LIMIT 1
            """,
            (brew_id,),
        ).fetchone()

        brew = conn.execute(
            "SELECT original_gravity FROM brews WHERE id = ?", (brew_id,)
        ).fetchone()

        final_gravity = latest["specific_gravity"] if latest else None
        calculated_abv = calculate_abv(
            brew["original_gravity"] if brew else None,
            final_gravity,
        )

        conn.execute(
            """
            UPDATE brews
            SET final_gravity = ?, calculated_abv = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                final_gravity,
                calculated_abv,
                datetime.now().isoformat(timespec="seconds"),
                brew_id,
            ),
        )


def delete_brew(brew_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM brews WHERE id = ?", (brew_id,))


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def show_dashboard() -> None:
    st.header("Brew dashboard")
    brews = load_brews()

    if brews.empty:
        st.info("No brews yet. Add your first batch from the sidebar.")
        return

    active_statuses = {
        "Planning",
        "Primary fermentation",
        "Secondary fermentation",
        "Conditioning",
        "Bottled",
    }
    active_count = int(brews["status"].isin(active_statuses).sum())
    completed_count = int((brews["status"] == "Completed").sum())
    average_abv = brews["calculated_abv"].dropna().mean()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total brews", len(brews))
    col2.metric("Active brews", active_count)
    col3.metric("Completed", completed_count)
    col4.metric(
        "Average ABV",
        f"{average_abv:.1f}%" if pd.notna(average_abv) else "—",
    )

    st.subheader("Current batches")
    display = brews[
        [
            "name",
            "brew_type",
            "style",
            "start_date",
            "status",
            "batch_size",
            "batch_size_unit",
            "original_gravity",
            "final_gravity",
            "calculated_abv",
        ]
    ].copy()
    display["Batch size"] = display.apply(
        lambda row: (
            f"{row['batch_size']:g} {row['batch_size_unit']}"
            if pd.notna(row["batch_size"])
            else "—"
        ),
        axis=1,
    )
    display["ABV"] = display["calculated_abv"].apply(
        lambda value: f"{value:.2f}%" if pd.notna(value) else "—"
    )
    display = display.rename(
        columns={
            "name": "Name",
            "brew_type": "Type",
            "style": "Style",
            "start_date": "Started",
            "status": "Status",
            "original_gravity": "OG",
            "final_gravity": "Latest/FG",
        }
    )
    display = display[
        ["Name", "Type", "Style", "Started", "Status", "Batch size", "OG", "Latest/FG", "ABV"]
    ]
    st.dataframe(display, use_container_width=True, hide_index=True)

    status_counts = brews["status"].value_counts().rename_axis("Status").reset_index(name="Brews")
    st.subheader("Brews by status")
    st.bar_chart(status_counts.set_index("Status"))


def show_add_brew() -> None:
    st.header("Add a brew")

    with st.form("add_brew_form", clear_on_submit=True):
        col1, col2 = st.columns(2)

        with col1:
            name = st.text_input("Brew name *", placeholder="Orange Blossom Mead #1")
            brew_type = st.selectbox("Brew type", BREW_TYPES)
            style = st.text_input("Style or recipe", placeholder="Traditional dry mead")
            start_date_value = st.date_input("Start date", value=date.today())
            status = st.selectbox("Status", STATUS_OPTIONS, index=1)

        with col2:
            batch_size = st.number_input(
                "Batch size",
                min_value=0.0,
                value=1.0,
                step=0.25,
            )
            batch_size_unit = st.selectbox("Batch size unit", ["gal", "L", "qt", "mL"])
            original_gravity = st.number_input(
                "Original gravity",
                min_value=0.0,
                max_value=2.0,
                value=1.000,
                step=0.001,
                format="%.3f",
                help="Enter 0 if it was not measured.",
            )
            target_abv = st.number_input(
                "Target ABV (%)",
                min_value=0.0,
                max_value=30.0,
                value=0.0,
                step=0.1,
            )

        col3, col4 = st.columns(2)
        with col3:
            yeast = st.text_input("Yeast", placeholder="Lalvin 71B")
            vessel = st.text_input("Fermentation vessel", placeholder="1-gallon glass carboy")
        with col4:
            temperature = st.number_input(
                "Fermentation temperature",
                min_value=0.0,
                value=0.0,
                step=1.0,
            )
            temperature_unit = st.selectbox("Temperature unit", ["°F", "°C"])

        process_notes = st.text_area(
            "Process notes",
            placeholder="Nutrient schedule, sanitation notes, planned additions, etc.",
        )

        submitted = st.form_submit_button("Create brew", type="primary")

    if submitted:
        if not name.strip():
            st.error("Brew name is required.")
            return

        brew_id = add_brew(
            name=name,
            brew_type=brew_type,
            style=style,
            batch_size=normalize_optional_number(batch_size),
            batch_size_unit=batch_size_unit,
            start_date=start_date_value,
            status=status,
            original_gravity=normalize_optional_number(original_gravity),
            target_abv=normalize_optional_number(target_abv),
            yeast=yeast,
            temperature=normalize_optional_number(temperature),
            temperature_unit=temperature_unit,
            vessel=vessel,
            process_notes=process_notes,
        )
        st.success(f"Created brew #{brew_id}: {name}")


def brew_selector(label: str = "Select a brew") -> tuple[int | None, pd.DataFrame]:
    brews = load_brews()
    if brews.empty:
        st.info("Add a brew first.")
        return None, brews

    labels = {
        int(row["id"]): f"{row['name']} — {row['start_date']} — {row['status']}"
        for _, row in brews.iterrows()
    }
    selected_id = st.selectbox(
        label,
        options=list(labels.keys()),
        format_func=lambda value: labels[value],
    )
    return int(selected_id), brews


def show_brew_details() -> None:
    st.header("Brew details")
    brew_id, _ = brew_selector()
    if brew_id is None:
        return

    brew = get_brew(brew_id)
    ingredients = get_ingredients(brew_id)
    readings = get_gravity_readings(brew_id)

    st.subheader(brew["name"])
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Status", brew["status"])
    col2.metric(
        "Batch size",
        f"{brew['batch_size']:g} {brew['batch_size_unit']}"
        if brew["batch_size"]
        else "—",
    )
    col3.metric(
        "ABV",
        f"{brew['calculated_abv']:.2f}%"
        if brew["calculated_abv"] is not None
        else "—",
    )
    start = parse_date(brew["start_date"])
    age_days = (date.today() - start).days if start else 0
    col4.metric("Batch age", f"{age_days} days")

    left, right = st.columns(2)
    with left:
        st.markdown("#### Batch information")
        st.write(f"**Type:** {brew['brew_type']}")
        st.write(f"**Style:** {brew['style'] or '—'}")
        st.write(f"**Started:** {brew['start_date']}")
        st.write(f"**Yeast:** {brew['yeast'] or '—'}")
        st.write(f"**Vessel:** {brew['vessel'] or '—'}")
        if brew["temperature"]:
            st.write(
                f"**Temperature:** {brew['temperature']:g} {brew['temperature_unit']}"
            )

    with right:
        st.markdown("#### Gravity and alcohol")
        st.write(
            f"**Original gravity:** "
            f"{brew['original_gravity']:.3f}"
            if brew["original_gravity"] is not None
            else "**Original gravity:** —"
        )
        st.write(
            f"**Latest/final gravity:** "
            f"{brew['final_gravity']:.3f}"
            if brew["final_gravity"] is not None
            else "**Latest/final gravity:** —"
        )
        st.write(
            f"**Target ABV:** {brew['target_abv']:.1f}%"
            if brew["target_abv"] is not None
            else "**Target ABV:** —"
        )
        st.write(
            f"**Estimated ABV:** {brew['calculated_abv']:.2f}%"
            if brew["calculated_abv"] is not None
            else "**Estimated ABV:** —"
        )
        st.caption("Edit these values in the **Edit brew** tab below.")

    tab1, tab2, tab3 = st.tabs(["Ingredients", "Gravity readings", "Edit brew"])

    with tab1:
        if ingredients.empty:
            st.info("No ingredients recorded.")
        else:
            st.dataframe(
                ingredients.drop(columns=["id"]).rename(
                    columns={
                        "ingredient_name": "Ingredient",
                        "amount": "Amount",
                        "unit": "Unit",
                        "category": "Category",
                        "notes": "Notes",
                    }
                ),
                use_container_width=True,
                hide_index=True,
            )

        with st.form("ingredient_form", clear_on_submit=True):
            cols = st.columns([2, 1, 1, 1.3])
            ingredient_name = cols[0].text_input("Ingredient")
            amount = cols[1].number_input("Amount", min_value=0.0, value=0.0, step=0.1)
            unit = cols[2].text_input("Unit", placeholder="lb, g, oz")
            category = cols[3].selectbox(
                "Category",
                ["Fermentable", "Yeast", "Nutrient", "Fruit", "Spice", "Additive", "Other"],
            )
            ingredient_notes = st.text_input("Ingredient notes")
            add_ingredient_clicked = st.form_submit_button("Add ingredient")

        if add_ingredient_clicked:
            if not ingredient_name.strip():
                st.error("Ingredient name is required.")
            else:
                add_ingredient(
                    brew_id,
                    ingredient_name,
                    normalize_optional_number(amount),
                    unit,
                    category,
                    ingredient_notes,
                )
                st.rerun()

        if not ingredients.empty:
            ingredient_to_delete = st.selectbox(
                "Remove an ingredient",
                options=ingredients["id"].tolist(),
                format_func=lambda item_id: ingredients.loc[
                    ingredients["id"] == item_id, "ingredient_name"
                ].iloc[0],
            )
            if st.button("Delete selected ingredient"):
                delete_ingredient(int(ingredient_to_delete))
                st.rerun()

    with tab2:
        if readings.empty:
            st.info("No gravity readings recorded.")
        else:
            chart_data = readings.copy()
            chart_data["reading_date"] = pd.to_datetime(chart_data["reading_date"])
            st.line_chart(
                chart_data.set_index("reading_date")[["specific_gravity"]]
            )
            st.dataframe(
                readings.drop(columns=["id"]).rename(
                    columns={
                        "reading_date": "Date",
                        "specific_gravity": "Specific gravity",
                        "temperature": "Temperature",
                        "temperature_unit": "Unit",
                        "notes": "Notes",
                    }
                ),
                use_container_width=True,
                hide_index=True,
            )

        with st.form("gravity_form", clear_on_submit=True):
            cols = st.columns(4)
            reading_date_value = cols[0].date_input("Reading date", value=date.today())
            specific_gravity = cols[1].number_input(
                "Specific gravity",
                min_value=0.900,
                max_value=2.000,
                value=1.000,
                step=0.001,
                format="%.3f",
            )
            reading_temp = cols[2].number_input(
                "Temperature",
                min_value=0.0,
                value=0.0,
                step=1.0,
            )
            reading_temp_unit = cols[3].selectbox("Temperature unit", ["°F", "°C"])
            reading_notes = st.text_input("Reading notes")
            add_reading_clicked = st.form_submit_button("Add gravity reading")

        if add_reading_clicked:
            add_gravity_reading(
                brew_id,
                reading_date_value,
                specific_gravity,
                normalize_optional_number(reading_temp),
                reading_temp_unit,
                reading_notes,
            )
            st.rerun()

        if not readings.empty:
            reading_to_delete = st.selectbox(
                "Remove a gravity reading",
                options=readings["id"].tolist(),
                format_func=lambda item_id: (
                    readings.loc[readings["id"] == item_id, "reading_date"].iloc[0]
                    + " — "
                    + f"{readings.loc[readings['id'] == item_id, 'specific_gravity'].iloc[0]:.3f}"
                ),
            )
            if st.button("Delete selected gravity reading"):
                delete_gravity_reading(int(reading_to_delete))
                st.rerun()

    with tab3:
        with st.form("update_brew_form"):
            st.markdown("#### Batch information")
            col1, col2 = st.columns(2)
            with col1:
                name = st.text_input("Brew name *", value=brew["name"])
                brew_type = st.selectbox(
                    "Brew type",
                    BREW_TYPES,
                    index=BREW_TYPES.index(brew["brew_type"])
                    if brew["brew_type"] in BREW_TYPES
                    else 0,
                )
                style = st.text_input("Style or recipe", value=brew["style"] or "")
                edit_start_date = st.date_input(
                    "Start date", value=parse_date(brew["start_date"]) or date.today()
                )
                status = st.selectbox(
                    "Status",
                    STATUS_OPTIONS,
                    index=STATUS_OPTIONS.index(brew["status"])
                    if brew["status"] in STATUS_OPTIONS
                    else 0,
                )

            with col2:
                edit_batch_size = st.number_input(
                    "Batch size",
                    min_value=0.0,
                    value=float(brew["batch_size"] or 0.0),
                    step=0.25,
                )
                edit_batch_size_unit = st.selectbox(
                    "Batch size unit",
                    ["gal", "L", "qt", "mL"],
                    index=["gal", "L", "qt", "mL"].index(brew["batch_size_unit"])
                    if brew["batch_size_unit"] in ["gal", "L", "qt", "mL"]
                    else 0,
                )
                edit_original_gravity = st.number_input(
                    "Original gravity",
                    min_value=0.0,
                    max_value=2.0,
                    value=float(brew["original_gravity"] or 1.000),
                    step=0.001,
                    format="%.3f",
                    help="Enter 0 if it was not measured.",
                )
                edit_target_abv = st.number_input(
                    "Target ABV (%)",
                    min_value=0.0,
                    max_value=30.0,
                    value=float(brew["target_abv"] or 0.0),
                    step=0.1,
                )

            col3, col4 = st.columns(2)
            with col3:
                edit_yeast = st.text_input("Yeast", value=brew["yeast"] or "")
                edit_vessel = st.text_input(
                    "Fermentation vessel", value=brew["vessel"] or ""
                )
            with col4:
                edit_temperature = st.number_input(
                    "Fermentation temperature",
                    min_value=0.0,
                    value=float(brew["temperature"] or 0.0),
                    step=1.0,
                )
                edit_temperature_unit = st.selectbox(
                    "Temperature unit",
                    ["°F", "°C"],
                    index=["°F", "°C"].index(brew["temperature_unit"])
                    if brew["temperature_unit"] in ["°F", "°C"]
                    else 0,
                )

            st.divider()
            st.markdown("#### Progress")

            date_cols = st.columns(3)
            rack_enabled = date_cols[0].checkbox(
                "Has rack date",
                value=brew["rack_date"] is not None,
            )
            rack_date = date_cols[0].date_input(
                "Rack date",
                value=parse_date(brew["rack_date"]) or date.today(),
                disabled=not rack_enabled,
            )

            bottle_enabled = date_cols[1].checkbox(
                "Has bottle date",
                value=brew["bottle_date"] is not None,
            )
            bottle_date = date_cols[1].date_input(
                "Bottle date",
                value=parse_date(brew["bottle_date"]) or date.today(),
                disabled=not bottle_enabled,
            )

            ready_enabled = date_cols[2].checkbox(
                "Has expected ready date",
                value=brew["expected_ready_date"] is not None,
            )
            expected_ready_date = date_cols[2].date_input(
                "Expected ready date",
                value=parse_date(brew["expected_ready_date"]) or date.today(),
                disabled=not ready_enabled,
            )

            final_gravity = st.number_input(
                "Final/latest gravity",
                min_value=0.0,
                max_value=2.0,
                value=float(brew["final_gravity"] or 0.0),
                step=0.001,
                format="%.3f",
                help="This is also updated automatically when you add a gravity reading.",
            )

            tasting_notes = st.text_area(
                "Tasting notes",
                value=brew["tasting_notes"] or "",
                placeholder="Sweetness, acidity, aroma, harshness, clarity, finish...",
            )
            process_notes = st.text_area(
                "Process notes",
                value=brew["process_notes"] or "",
                placeholder="Nutrient additions, transfers, stabilization, backsweetening...",
            )

            save_clicked = st.form_submit_button("Save changes", type="primary")

        if save_clicked:
            if not name.strip():
                st.error("Brew name is required.")
            else:
                update_brew(
                    brew_id=brew_id,
                    name=name,
                    brew_type=brew_type,
                    style=style,
                    batch_size=normalize_optional_number(edit_batch_size),
                    batch_size_unit=edit_batch_size_unit,
                    start_date=edit_start_date,
                    status=status,
                    original_gravity=normalize_optional_number(edit_original_gravity),
                    target_abv=normalize_optional_number(edit_target_abv),
                    yeast=edit_yeast,
                    vessel=edit_vessel,
                    temperature=normalize_optional_number(edit_temperature),
                    temperature_unit=edit_temperature_unit,
                    rack_date=rack_date if rack_enabled else None,
                    bottle_date=bottle_date if bottle_enabled else None,
                    expected_ready_date=expected_ready_date if ready_enabled else None,
                    final_gravity=normalize_optional_number(final_gravity),
                    tasting_notes=tasting_notes,
                    process_notes=process_notes,
                )
                st.success("Brew updated.")
                st.rerun()

        st.divider()
        st.warning("Deleting a brew also deletes all of its ingredients and gravity readings.")
        confirm_delete = st.checkbox("I understand and want to delete this brew")
        if st.button("Delete brew", disabled=not confirm_delete):
            delete_brew(brew_id)
            st.success("Brew deleted.")
            st.rerun()


def show_export() -> None:
    st.header("Export data")
    brews = load_brews()

    if brews.empty:
        st.info("There is no data to export yet.")
        return

    st.download_button(
        "Download all brews as CSV",
        data=brews.to_csv(index=False).encode("utf-8"),
        file_name="brews.csv",
        mime="text/csv",
    )

    brew_id, _ = brew_selector("Select a brew for detailed exports")
    if brew_id is None:
        return

    ingredients = get_ingredients(brew_id)
    readings = get_gravity_readings(brew_id)

    col1, col2 = st.columns(2)
    col1.download_button(
        "Download ingredients CSV",
        data=ingredients.to_csv(index=False).encode("utf-8"),
        file_name=f"brew_{brew_id}_ingredients.csv",
        mime="text/csv",
    )
    col2.download_button(
        "Download gravity readings CSV",
        data=readings.to_csv(index=False).encode("utf-8"),
        file_name=f"brew_{brew_id}_gravity_readings.csv",
        mime="text/csv",
    )


def main() -> None:
    st.set_page_config(
        page_title="Brew Tracker",
        page_icon="🍯",
        layout="wide",
    )
    init_db()

    st.title("Brew Tracker")
    st.caption("Track fermentation, ingredients, gravity, alcohol content, and tasting notes.")

    page = st.sidebar.radio(
        "Navigation",
        ["Dashboard", "Add brew", "Brew details", "Export"],
    )

    st.sidebar.divider()
    st.sidebar.markdown(
        """
        **ABV formula**

        Estimated ABV =  
        `(original gravity − final gravity) × 131.25`
        """
    )

    if page == "Dashboard":
        show_dashboard()
    elif page == "Add brew":
        show_add_brew()
    elif page == "Brew details":
        show_brew_details()
    else:
        show_export()


if __name__ == "__main__":
    main()
