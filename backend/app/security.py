import bcrypt

def hash_password(password: str) -> str:
    # Generate a salt
    salt = bcrypt.gensalt()
    # Hash the password with the salt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verify the password by comparing the plain password with the hashed password
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))