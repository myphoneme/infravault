import bcrypt
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet

def hash_password(password: str) -> str:
    # Generate a salt
    salt = bcrypt.gensalt()
    # Hash the password with the salt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Verify the password by comparing the plain password with the hashed password
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


load_dotenv()

DEVICE_ENCRYPTION_KEY = os.getenv("DEVICE_ENCRYPTION_KEY")

if not DEVICE_ENCRYPTION_KEY:
    raise RuntimeError("DEVICE_ENCRYPTION_KEY is not configured")

cypher = Fernet(DEVICE_ENCRYPTION_KEY.encode())


def encrypt_device_password(password: str) -> str:
    return cypher.encrypt(password.encode()).decode()


def decrypt_device_password(encrypted_password: str) -> str:
    return cypher.decrypt(encrypted_password.encode()).decode()