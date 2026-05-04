from fastapi import FastAPI
from pydantic import BaseModel
import nmap
import os

app = FastAPI()

class ScanRequest(BaseModel):
    target: str
    ports: str = "1-1024"
    version_scan: bool = False
    vuln: bool = False

def is_root():
    return os.geteuid() == 0

@app.get("/")
def root():
    return {"status": "Agent running", "root": is_root()}

@app.post("/scan")
def run_scan(req: ScanRequest):
    scanner = nmap.PortScanner()

    scan_type = "-sS" if is_root() else "-sT"
    args = f"{scan_type} -T4"

    if req.version_scan:
        args += " -sV"

    if req.vuln:
        args += " --script vuln"

    scanner.scan(hosts=req.target, ports=req.ports, arguments=args)

    results = {}

    for host in scanner.all_hosts():
        results[host] = []
        for proto in scanner[host].all_protocols():
            for port in scanner[host][proto]:
                svc = scanner[host][proto][port]
                if svc["state"] == "open":
                    results[host].append({
                        "port": port,
                        "service": svc.get("name"),
                        "product": svc.get("product"),
                        "version": svc.get("version"),
                    })

    return {
        "target": req.target,
        "results": results
    }