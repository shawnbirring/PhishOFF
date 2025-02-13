from email import policy
from email.parser import BytesParser
from email.headerregistry import Address
import requests
import re


def parse_sender_ip(eml_file_path):
    """
    Parse sender IP from eml file.

    :param: File path of eml file to parse
    :return: String of IP address
    """
    with open(eml_file_path, "rb") as eml_file:
        msg = BytesParser(policy=policy.default).parse(eml_file)

    # extract "Received" headers
    received_headers = msg.get_all("Received", [])

    # regular expression/regex to find IP addresses in Received headers
    # \b: word boundary-ensures that IP is standalone and not part of another word; at the front and back to enclose the word
    # ?: non-capturing group
    # \d(1, 3): matches 1 to 3 digits (the octets of IPv4)
    # \.: matches "."
    # {3}: repeats previous pattern 3 times
    ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')

    for header in received_headers:
        ip_match = ip_pattern.findall(header)
        if ip_match:
            # if there were a list of IPs, the last matched IP is most likely to be the sender IP
            return ip_match[-1]

    return None


def get_email_domain(email_address):
    """
    Parse sender address to extract email domain.

    :param email_address: String of email address
    :return: String of email domain
    """
    if email_address:
        return email_address.split("@")[-1]
    else:
        return None


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


def check_spamhaus(sender):
    """
    Check address check.spamhaus.org to see if sender is listed as suspicious.

    :param sender: String of email address or IP
    :return: bool if sender is suspicious
    """
    url = f"https://check.spamhaus.org/{sender}"
    response = requests.get(url)
    suspicious = True if "is listed" in response.text else False
    return suspicious


def analyze_sender(sender_address, sender_ip):
    """
    Analyze sender to see if it listed as suspicious with online spam databases.
    TODO: implement more free databases

    :param sender_address: String of email address
    :param sender_ip: String of email IP
    :return: bool if sender is deemed suspicious
    """
    spamhaus_email = check_spamhaus(sender_address)
    spamhaus_ip = check_spamhaus(sender_ip)
    suspicion_list = [spamhaus_email, spamhaus_ip]
    
    # checks if all bools in list are true
    return all(suspicion_list)

