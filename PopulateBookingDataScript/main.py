import pymysql
import re

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'harvest_admin',
    'password': 'Hkibrahim@3',
    'db': 'harvest_schools',
    'charset': 'utf8mb4'
}

DEFAULT_CD_COUNT = 0
DEFAULT_ADDITIONAL_ATTENDEES = 0
DEFAULT_PAYMENT_STATUS = 'Not Signed Up'

def get_school_division(grade):
    if grade == 'Playschool':
        return 'Kindergarten'
    elif grade in ['KG1', 'KG2']:
        return 'National'
    elif grade in ['IF1', 'IF2']:
        return 'International'
    else:
        return 'National'

def normalize_name(name):
    if not name or name == '0':
        return ""
    return ' '.join(name.strip().lower().split())

def are_siblings(student1, student2):
    criteria_met = 0

    father1_name = normalize_name(student1['fatherName'])
    father2_name = normalize_name(student2['fatherName'])
    father1_mobile = student1['fatherMobile']
    father2_mobile = student2['fatherMobile']
    mother1_name = normalize_name(student1['motherName'])
    mother2_name = normalize_name(student2['motherName'])
    mother1_mobile = student1['motherMobile']
    mother2_mobile = student2['motherMobile']


    # if (father1_name and father2_name and father1_name == father2_name and
    #         mother1_name and mother2_name and mother1_name == mother2_name and
    #         father1_mobile and father2_mobile and father1_mobile == father2_mobile and
    #     mother1_mobile and mother2_mobile and mother1_mobile == mother2_mobile):
    #     criteria_met += 1


    if (student1['username'] and student2['username'] and
            student1['username'] == student2['username'] and
            student1['password'] and student2['password'] and
            student1['password'] == student2['password']):
        criteria_met += 1

    return criteria_met >= 1

def group_siblings(sections):
    all_students = []

    for section in sections:
        all_students.extend(section['students'])

    families = []
    processed_students = set()

    for i, student in enumerate(all_students):
        if i in processed_students:
            continue

        family = [student]
        processed_students.add(i)

        for j, other_student in enumerate(all_students[i+1:], i+1):
            if j in processed_students:
                continue

            is_family_member = False
            for family_member in family:
                if are_siblings(other_student, family_member):
                    is_family_member = True
                    break

            if is_family_member:
                family.append(other_student)
                processed_students.add(j)

        families.append(family)

    family_dict = {}
    for i, family in enumerate(families):
        first_student = family[0]
        auth_key = f"{first_student['username']}:{first_student['password']}"

        if auth_key in family_dict:
            family_dict[auth_key].extend(family)
        else:
            family_dict[auth_key] = family

    return family_dict

def parse_csv_file(filename):
    sections = []
    current_section = None
    current_grade = None
    current_division = None

    try:
        with open(filename, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()

            for line in lines:
                line = line.strip()

                stage_grade_match = re.search(r'Stage:([^|]+)\s*\|\s*Grade:([^|]+)', line)
                if stage_grade_match:
                    current_division = stage_grade_match.group(1).strip()
                    current_grade = stage_grade_match.group(2).strip()
                    current_section = {
                        'division': current_division,
                        'grade': current_grade,
                        'students': []
                    }
                    sections.append(current_section)
                    print(f"Found section: {current_division} - {current_grade}")
                    continue

                if not line or line.startswith('Sr,') or line == ',,,,,,,,,,,,,':
                    continue

                if current_section and ',' in line:
                    parts = line.split(',')
                    if len(parts) >= 8 and parts[0].strip() and parts[0].strip().isdigit():
                        student = {
                            'sr': parts[0].strip(),
                            'name': clean_name(parts[1].strip()),
                            'fatherMobile': parts[2].strip(),
                            'motherMobile': parts[3].strip(),
                            'fatherName': clean_name(parts[4].strip()),
                            'motherName': clean_name(parts[5].strip()),
                            'username': parts[6].strip(),
                            'password': parts[7].strip(),
                            'grade': current_grade,
                            'division': get_school_division(current_grade)
                        }

                        if student['name']:
                            current_section['students'].append(student)

        return sections
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return []

def clean_name(name):
    if name:
        name = name.strip()
        if re.match(r'^[a-zA-Z\s]+$', name):
            return ' '.join(word.capitalize() for word in name.split())
        else:
            return name
    else:
        return name


def insert_booking_data(conn, families, check_existing_parents=True):
    try:
        with conn.cursor() as cursor:
            families_processed = 0
            total_families = len(families)

            for auth_key, students in families.items():
                try:
                    conn.begin()

                    first_student = students[0]
                    username = first_student['username']
                    password = first_student['password']

                    if not username or not password or not first_student['fatherName']:
                        print(f"Skipping family - missing essential data: {auth_key}")
                        conn.rollback()
                        continue

                    cursor.execute(
                        "INSERT INTO booking_auth_credentials (username, password_hash) VALUES (%s, SHA2(%s, 256))",
                        (username, password)
                    )
                    auth_id = cursor.lastrowid

                    cursor.execute("INSERT INTO bookings (auth_id) VALUES (%s)", (auth_id,))
                    booking_id = cursor.lastrowid

                    cursor.execute(
                        "SELECT parent_id FROM booking_parents WHERE name = %s AND phone_number = %s",
                        (first_student['fatherName'], first_student['fatherMobile'])
                    )
                    existing_father = cursor.fetchone()

                    if existing_father and check_existing_parents:
                        first_parent_id = existing_father[0]
                    else:
                        cursor.execute(
                            "INSERT INTO booking_parents (name, email, phone_number) VALUES (%s, %s, %s)",
                            (first_student['fatherName'], "", first_student['fatherMobile'])
                        )
                        first_parent_id = cursor.lastrowid

                    cursor.execute(
                        "INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (%s, %s, %s)",
                        (booking_id, first_parent_id, 1)
                    )

                    if first_student['motherName'] and first_student['motherName'] != '0':
                        cursor.execute(
                            "SELECT parent_id FROM booking_parents WHERE name = %s AND phone_number = %s",
                            (first_student['motherName'], first_student['motherMobile'])
                        )
                        existing_mother = cursor.fetchone()

                        if existing_mother and check_existing_parents:
                            second_parent_id = existing_mother[0]
                        else:
                            cursor.execute(
                                "INSERT INTO booking_parents (name, email, phone_number) VALUES (%s, %s, %s)",
                                (first_student['motherName'], "", first_student['motherMobile'])
                            )
                            second_parent_id = cursor.lastrowid

                        cursor.execute(
                            "INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (%s, %s, %s)",
                            (booking_id, second_parent_id, 0)
                        )

                    for student in students:
                        cursor.execute(
                            "INSERT INTO booking_students (name, school_division, grade) VALUES (%s, %s, %s)",
                            (student['name'], student['division'], student['grade'])
                        )
                        student_id = cursor.lastrowid

                        cursor.execute(
                            "INSERT INTO booking_students_linker (booking_id, student_id) VALUES (%s, %s)",
                            (booking_id, student_id)
                        )

                    cursor.execute(
                        "INSERT INTO booking_extras (booking_id, cd_count, additional_attendees, payment_status) VALUES (%s, %s, %s, %s)",
                        (booking_id, DEFAULT_CD_COUNT, DEFAULT_ADDITIONAL_ATTENDEES, DEFAULT_PAYMENT_STATUS)
                    )

                    conn.commit()
                    families_processed += 1

                    if families_processed % 10 == 0:
                        print(f"Processed {families_processed}/{total_families} families")

                except Exception as e:
                    print(f"Error processing family {auth_key}: {e}")
                    conn.rollback()

            print(f"Successfully processed {families_processed} out of {total_families} families")

    except Exception as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()


def empty_all_tables(conn):
    try:
        with conn.cursor() as cursor:
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            cursor.execute("TRUNCATE TABLE booking_auth_credentials")
            cursor.execute("TRUNCATE TABLE booking_students")
            cursor.execute("TRUNCATE TABLE booking_parents")
            cursor.execute("TRUNCATE TABLE booking_extras")
            cursor.execute("TRUNCATE TABLE booking_students_linker")
            cursor.execute("TRUNCATE TABLE booking_parents_linker")
            cursor.execute("TRUNCATE TABLE bookings")
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            conn.commit()
    except Exception as e:
        print(f"Error emptying tables: {e}")
        conn.rollback()

def main():
    print("Parsing CSV file...")
    sections = parse_csv_file('All 2025 KG Graduation Bookings.csv')

    if not sections:
        print("No data found in CSV.")
        return

    print("\nSections found:")
    for section in sections:
        print(f"{section['division']} - {section['grade']}: {len(section['students'])} students")

    print("\nGrouping students into families...")
    families = group_siblings(sections)

    print(f"Found {len(families)} unique families")

    family_sizes = [len(students) for students in families.values()]
    single_child_families = sum(1 for size in family_sizes if size == 1)
    multi_child_families = sum(1 for size in family_sizes if size > 1)

    print(f"Single-child families: {single_child_families}")
    print(f"Multi-child families: {multi_child_families}")

    if multi_child_families > 0:
        max_family_size = max(family_sizes)
        print(f"Largest family size: {max_family_size}")

    try:
        print(f"\nConnecting to database at {DB_CONFIG['host']}...")
        conn = pymysql.connect(**DB_CONFIG)
        print("Database connection established.")

        print("\nEmptying existing data from tables...")
        empty_all_tables(conn)

        print("\nInserting booking data...")
        insert_booking_data(conn, families, check_existing_parents=False)

        conn.close()
        print("\nDatabase population completed.")

    except Exception as e:
        print(f"Error connecting to database: {e}")

if __name__ == "__main__":
    main()
