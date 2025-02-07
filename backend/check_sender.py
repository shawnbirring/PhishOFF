import email
from email import policy
from email.parser import BytesParser
from email.headerregistry import Address


def parse_sender(eml_file_path):
    """
    Parse sender address from eml file.

    :param eml_file_path: File path of eml file to parse
    :return: String of sender address
    """
    with open(eml_file_path, "rb") as eml_file:
        msg = BytesParser(policy=policy.default).parse(eml_file)
    sender = msg["From"]

    if sender:
        return sender.addresses[0].addr_spec if sender.addresses else None  # Extracts only the email

    return None 


