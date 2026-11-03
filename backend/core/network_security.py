import ipaddress
import logging
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status

logger = logging.getLogger("relvnt.security.network")


def validate_public_url(url: str, allow_localhost: bool = False) -> str:
    """
    SSRF Protection Guard:
    Validates destination URLs before outbound HTTP requests.
    Rejects private, link-local, loopback, or cloud-metadata IP addresses (RFC 1918, RFC 3927, AWS/GCP metadata).
    """
    clean_url = (url or "").strip()
    if not clean_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL parameter is required.",
        )

    parsed = urlparse(clean_url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL scheme. Only HTTP and HTTPS protocols are permitted.",
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL destination host.",
        )

    # Block well-known cloud metadata hostnames
    lowered_host = hostname.lower()
    if lowered_host in ("metadata.google.internal", "instance-data", "metadata"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Destination host is forbidden by security governance.",
        )

    # In local testing sandbox, allow localhost if explicitly requested
    if allow_localhost and lowered_host in ("localhost", "127.0.0.1", "::1"):
        return clean_url

    try:
        # Resolve all IPs for hostname to guard against DNS rebinding
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip_str = entry[4][0]
            ip = ipaddress.ip_address(ip_str)

            # Block private networks, loopback, link-local, and reserved ranges
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                if not (allow_localhost and ip.is_loopback):
                    logger.warning("SSRF block: %s resolves to restricted IP %s", hostname, ip_str)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Outbound request to internal or private network addresses is forbidden.",
                    )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to resolve destination host '{hostname}'. Please verify URL.",
        )

    return clean_url
