import argparse
import json
import os
import sys

import nmap


def is_root():
    return hasattr(os, "geteuid") and os.geteuid() == 0


def collect_open_ports(scanner):
    results = {}
    open_ports = {}

    for host in scanner.all_hosts():
        results[host] = []
        open_ports[host] = []
        for proto in scanner[host].all_protocols():
            for port in scanner[host][proto]:
                svc = scanner[host][proto][port]
                if svc.get("state") == "open":
                    results[host].append(
                        {
                            "port": port,
                            "protocol": proto,
                            "service": svc.get("name"),
                            "product": svc.get("product"),
                            "version": svc.get("version"),
                        }
                    )
                    open_ports[host].append(port)

    return results, open_ports


def run_vuln_scan(target, open_ports_by_host):
    vulnerabilities = []
    vuln_scanner = nmap.PortScanner()

    for host, ports in open_ports_by_host.items():
        if not ports:
            continue

        port_str = ",".join(str(p) for p in sorted(set(ports)))
        vuln_scanner.scan(hosts=host, ports=port_str, arguments="--script vuln")

        if host not in vuln_scanner.all_hosts():
            continue

        for proto in vuln_scanner[host].all_protocols():
            for port in vuln_scanner[host][proto]:
                svc = vuln_scanner[host][proto][port]
                scripts = svc.get("script", {})
                for script_name, output in scripts.items():
                    output_text = str(output)
                    if "VULNERABLE" in output_text.upper() or "CVE-" in output_text.upper():
                        vulnerabilities.append(
                            {
                                "host": host,
                                "port": port,
                                "protocol": proto,
                                "script": script_name,
                                "output": output_text[:1000],
                            }
                        )

    return vulnerabilities


def run_scan(target, ports):
    scanner = nmap.PortScanner()
    scan_type = "-sS" if is_root() else "-sT"
    args = f"{scan_type} -T4 -sV -sC --version-intensity 7"

    scanner.scan(hosts=target, ports=ports, arguments=args)

    results, open_ports = collect_open_ports(scanner)
    vulnerabilities = run_vuln_scan(target, open_ports)

    return {
        "target": target,
        "ports": ports,
        "results": results,
        "vulnerabilities": vulnerabilities,
    }


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
