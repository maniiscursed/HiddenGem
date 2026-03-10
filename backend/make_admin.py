import sqlite3
conn = sqlite3.connect('hiddengem.db')
c = conn.cursor()
c.execute("UPDATE users SET role = 'admin'")
conn.commit()
conn.close()
print("Updated all users to admin")
