import pytest
import os
from HIDS.fim_scanner import calculate_sha256, get_current_fim_alerts
from HIDS.process_scanner import get_suspicious_processes

def test_calculate_sha256(tmp_path):
    test_file = tmp_path / "test.txt"
    test_file.write_text("test content for hashing")
    hash_val = calculate_sha256(str(test_file))
    assert isinstance(hash_val, str)
    assert len(hash_val) == 64

def test_get_current_fim_alerts():
    alerts = get_current_fim_alerts()
    assert isinstance(alerts, list)

def test_get_suspicious_processes():
    result = get_suspicious_processes()
    assert "processes" in result
    assert "system_stats" in result
    assert isinstance(result["processes"], list)
    assert "total_cpu" in result["system_stats"]
    assert "total_ram" in result["system_stats"]
