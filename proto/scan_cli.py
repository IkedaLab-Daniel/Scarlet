import argparse
import json
import os
import sys

import nmap


def is_root():
    return hasattr(os, "geteuid") and os.geteuid() == 0


def run_scan(target, ports):
    scanner = nmap.PortScanner()
    scan_type = "-sS" if is_root() else "-sT"
    args = f"{scan_type} -T4"

    scanner.scan(hosts=target, ports=ports, arguments=args)

    results = {}

    for host in scanner.all_hosts():
        results[host] = []
        for proto in scanner[host].all_protocols():
            for port in scanner[host][proto]:
                svc = scanner[host][proto][port]
                if svc.get("state") == "open":
                    results[host].append(
                        {
                            "port": port,
                            "service": svc.get("name"),
                            "product": svc.get("product"),
                            "version": svc.get("version"),
                        }
                    )

    return {"target": target, "ports": ports, "results": results}


def main():
    parser = argparse.ArgumentParser(description="Scarlet scan CLI")
    parser.add_argument("--target", required=True)
    parser.add_argument("--ports", default="1-1024")
    args = parser.parse_args()

    try:
        payload = run_scan(args.target, args.ports)
        print(json.dumps(payload))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
