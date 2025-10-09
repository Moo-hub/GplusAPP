#!/usr/bin/env python
"""
Redis Monitoring and Optimization CLI Tool
This script provides command-line utilities for monitoring Redis performance,
checking security event storage, applying data retention policies, and
optimizing cache performance.

Usage:
  python redis_monitor_cli.py stats          # Show Redis stats
  python redis_monitor_cli.py retention      # Run retention policies
  python redis_monitor_cli.py optimize       # Run full optimization
  python redis_monitor_cli.py keys           # Show keys without expiry
  python redis_monitor_cli.py patterns       # Show memory usage by pattern
  python redis_monitor_cli.py memory         # Show detailed memory stats
  python redis_monitor_cli.py cache          # Show cache metrics
  python redis_monitor_cli.py preload        # Run cache preloading
  python redis_monitor_cli.py invalidate <namespace> # Invalidate cache namespace
"""

import os
import sys
import argparse
import json
import time
import asyncio
from datetime import datetime
from rich.console import Console
from rich.table import Table

# Add parent directory to path so we can import from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.redis_monitor import (
    get_redis_stats,
    run_retention_policy_enforcement,
    run_full_optimization,
    get_keys_without_expiry,
    get_memory_usage_by_key_pattern,
    RETENTION_POLICIES
)

# Import new Redis optimization modules
try:
    from app.core.redis_cache import (
        get_cache_metrics,
        reset_cache_metrics,
        invalidate_namespace,
        CACHE_CONFIG
    )
    from app.core.redis_memory_monitor import (
        get_memory_stats,
        get_memory_pressure_level,
        get_memory_trend,
        get_largest_keys,
        apply_adaptive_ttl
    )
    from app.core.redis_cache_preload import (
        run_cache_preload,
        PRELOAD_CONFIG
    )
    
    cache_modules_available = True
except ImportError:
    cache_modules_available = False

console = Console()


def format_bytes(size_bytes):
    """Format bytes to human-readable string"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def show_redis_stats():
    """Display Redis statistics"""
    console.print("[bold blue]Redis Statistics[/bold blue]")
    
    stats = get_redis_stats()
    if not stats:
        console.print("[bold red]Error: Could not get Redis statistics[/bold red]")
        return
    
    # Create a table for Redis stats
    table = Table(show_header=True, header_style="bold")
    table.add_column("Metric")
    table.add_column("Value")
    
    table.add_row("Used Memory", format_bytes(stats.used_memory))
    table.add_row("Peak Memory", format_bytes(stats.used_memory_peak))
    table.add_row("Memory (RSS)", format_bytes(stats.used_memory_rss))
    table.add_row("Total Keys", str(stats.total_keys))
    table.add_row("Security Keys", str(stats.security_keys_count))
    table.add_row("Token Keys", str(stats.token_keys_count))
    table.add_row("Expired Keys", str(stats.expired_keys))
    table.add_row("Evicted Keys", str(stats.evicted_keys))
    table.add_row("Connected Clients", str(stats.connected_clients))
    table.add_row("Uptime", f"{stats.uptime_in_seconds // 86400} days, {(stats.uptime_in_seconds % 86400) // 3600} hours")
    
    console.print(table)


def run_retention():
    """Run retention policies"""
    console.print("[bold blue]Running Redis Retention Policies[/bold blue]")
    
    start_time = time.time()
    run_retention_policy_enforcement()
    duration = time.time() - start_time
    
    console.print(f"[green]Retention policies completed in {duration:.2f} seconds[/green]")


def optimize():
    """Run full optimization"""
    console.print("[bold blue]Running Redis Full Optimization[/bold blue]")
    
    start_time = time.time()
    run_full_optimization()
    duration = time.time() - start_time
    
    console.print(f"[green]Optimization completed in {duration:.2f} seconds[/green]")


def show_keys_without_expiry():
    """Show keys without expiry"""
    console.print("[bold blue]Redis Keys Without Expiry[/bold blue]")
    
    keys = get_keys_without_expiry(limit=50)
    if not keys:
        console.print("No keys without expiry found.")
        return
    
    table = Table(show_header=True, header_style="bold")
    table.add_column("Key")
    table.add_column("Type")
    table.add_column("Size")
    
    for key_info in keys:
        table.add_row(
            key_info["key"], 
            key_info["type"], 
            str(key_info["size"])
        )
    
    console.print(table)
    console.print(f"[yellow]Found {len(keys)} keys without expiry (showing max 50)[/yellow]")


def show_patterns():
    """Show memory usage by pattern"""
    console.print("[bold blue]Redis Memory Usage by Pattern[/bold blue]")
    
    # First show retention policies
    console.print("[bold green]Current Retention Policies:[/bold green]")
    policy_table = Table(show_header=True, header_style="bold")
    policy_table.add_column("Pattern")
    policy_table.add_column("TTL")
    policy_table.add_column("Description")
    
    for pattern, policy in RETENTION_POLICIES.items():
        ttl_days = policy["ttl"] / (60 * 60 * 24)
        policy_table.add_row(
            pattern,
            f"{ttl_days:.1f} days",
            policy["description"]
        )
    
    console.print(policy_table)
    
    # Then show memory usage
    console.print("\n[bold green]Memory Usage by Pattern:[/bold green]")
    memory = get_memory_usage_by_key_pattern()
    if not memory:
        console.print("Could not calculate memory usage by pattern.")
        return
    
    memory_table = Table(show_header=True, header_style="bold")
    memory_table.add_column("Pattern")
    memory_table.add_column("Memory Usage")
    memory_table.add_column("Percentage")
    
    # Calculate total for percentage
    total = sum(memory.values())
    
    for pattern, usage in sorted(memory.items(), key=lambda x: x[1], reverse=True):
        if total > 0:
            percentage = (usage / total) * 100
            memory_table.add_row(
                pattern,
                format_bytes(usage),
                f"{percentage:.2f}%"
            )
        else:
            memory_table.add_row(pattern, format_bytes(usage), "N/A")
    
    console.print(memory_table)


def show_memory_stats():
    """Show detailed memory statistics"""
    if not cache_modules_available:
        console.print("[bold red]Error: Advanced memory monitoring not available[/bold red]")
        return
    
    console.print("[bold blue]Redis Detailed Memory Statistics[/bold blue]")
    
    stats = get_memory_stats()
    if "error" in stats:
        console.print(f"[bold red]Error: {stats['error']}[/bold red]")
        return
    
    # Create main stats table
    table = Table(show_header=True, header_style="bold")
    table.add_column("Metric")
    table.add_column("Value")
    
    table.add_row("Used Memory", format_bytes(stats["memory_used"]))
    table.add_row("Peak Memory", format_bytes(stats["memory_peak"]))
    table.add_row("RSS Memory", format_bytes(stats["memory_rss"]))
    table.add_row("Max Memory", format_bytes(stats["memory_max"]) if stats["memory_max"] > 0 else "Not Set")
    table.add_row("Memory Usage", f"{stats['used_percent']:.2f}%")
    table.add_row("Pressure Level", stats["pressure_level"])
    table.add_row("Trend Direction", f"{stats['trend_direction']} ({stats['trend_rate']:.2f}%/hr)")
    table.add_row("TTL Adjustment Factor", f"{stats['ttl_adjustment']:.2f}")
    
    console.print(table)
    
    # Show largest keys
    console.print("\n[bold green]Largest Keys:[/bold green]")
    keys_table = Table(show_header=True, header_style="bold")
    keys_table.add_column("Key")
    keys_table.add_column("Size")
    keys_table.add_column("Type")
    keys_table.add_column("TTL")
    
    for key_info in stats["largest_keys"]:
        ttl = key_info["ttl"]
        ttl_str = "No expiry" if ttl == -1 else (f"{ttl} seconds" if ttl > 0 else "Expired")
        
        keys_table.add_row(
            key_info["key"],
            format_bytes(key_info["memory"]),
            key_info["type"],
            ttl_str
        )
    
    console.print(keys_table)
    
    # Show action recommendations
    console.print("\n[bold green]Recommended Actions:[/bold green]")
    
    if stats["pressure_level"] == "critical":
        console.print("[bold red]CRITICAL memory pressure detected![/bold red]")
        console.print("- Immediately run optimization: python redis_monitor_cli.py optimize")
        console.print("- Consider invalidating large cache namespaces: python redis_monitor_cli.py invalidate <namespace>")
        console.print("- Apply adaptive TTL: python redis_monitor_cli.py adaptive-ttl")
    elif stats["pressure_level"] == "high":
        console.print("[bold yellow]HIGH memory pressure detected![/bold yellow]")
        console.print("- Run optimization soon: python redis_monitor_cli.py optimize")
        console.print("- Apply adaptive TTL: python redis_monitor_cli.py adaptive-ttl")
    elif stats["pressure_level"] == "medium":
        console.print("[bold yellow]Medium memory pressure detected[/bold yellow]")
        console.print("- Consider running optimization: python redis_monitor_cli.py optimize")
    else:
        console.print("[bold green]Memory pressure is low, no action needed[/bold green]")


def show_cache_metrics():
    """Show cache performance metrics"""
    if not cache_modules_available:
        console.print("[bold red]Error: Cache metrics not available[/bold red]")
        return
    
    console.print("[bold blue]Redis Cache Performance Metrics[/bold blue]")
    
    metrics = get_cache_metrics()
    
    # Check if metrics are enabled
    if not metrics.get("enabled", True):
        console.print("[bold yellow]Cache metrics are disabled[/bold yellow]")
        return
    
    # Create main metrics table
    table = Table(show_header=True, header_style="bold")
    table.add_column("Metric")
    table.add_column("Value")
    
    hits = metrics.get("hits", 0)
    misses = metrics.get("misses", 0)
    hit_rate = metrics.get("hit_rate", 0)
    
    table.add_row("Cache Hits", str(hits))
    table.add_row("Cache Misses", str(misses))
    table.add_row("Cache Hit Rate", f"{hit_rate:.2f}%")
    table.add_row("Cache Sets", str(metrics.get("sets", 0)))
    table.add_row("Cache Invalidations", str(metrics.get("invalidations", 0)))
    table.add_row("Cache Errors", str(metrics.get("errors", 0)))
    table.add_row("Last Reset", metrics.get("last_reset", "N/A"))
    
    console.print(table)
    
    # Show cache configuration
    if hasattr(CACHE_CONFIG, "namespaces") and hasattr(CACHE_CONFIG, "ttl"):
        console.print("\n[bold green]Cache Configuration:[/bold green]")
        config_table = Table(show_header=True, header_style="bold")
        config_table.add_column("Namespace")
        config_table.add_column("TTL")
        
        for namespace, ttl in CACHE_CONFIG["ttl"].items():
            config_table.add_row(
                namespace,
                f"{ttl // 60} minutes" if ttl >= 60 else f"{ttl} seconds"
            )
        
        console.print(config_table)


async def run_preload():
    """Run cache preloading"""
    if not cache_modules_available:
        console.print("[bold red]Error: Cache preloading not available[/bold red]")
        return
    
    console.print("[bold blue]Running Redis Cache Preloading[/bold blue]")
    
    # Show preload configuration
    console.print("[bold green]Preload Configuration:[/bold green]")
    config_table = Table(show_header=True, header_style="bold")
    config_table.add_column("Entity Type")
    config_table.add_column("Enabled")
    config_table.add_column("Limit")
    config_table.add_column("TTL")
    
    for entity_type, config in PRELOAD_CONFIG.items():
        config_table.add_row(
            entity_type,
            str(config.get("enabled", False)),
            str(config.get("limit", 0)),
            f"{config.get('ttl', 0) // 60} minutes"
        )
    
    console.print(config_table)
    
    # Run preload
    console.print("\n[bold green]Running preload...[/bold green]")
    start_time = time.time()
    preloaded_count = await run_cache_preload()
    duration = time.time() - start_time
    
    console.print(f"[green]Preloaded {preloaded_count} items in {duration:.2f} seconds[/green]")


def run_invalidate(namespace):
    """Invalidate a cache namespace"""
    if not cache_modules_available:
        console.print("[bold red]Error: Cache invalidation not available[/bold red]")
        return
    
    console.print(f"[bold blue]Invalidating Cache Namespace: {namespace}[/bold blue]")
    
    start_time = time.time()
    invalidated_count = invalidate_namespace(namespace)
    duration = time.time() - start_time
    
    console.print(f"[green]Invalidated {invalidated_count} keys in namespace '{namespace}' in {duration:.2f} seconds[/green]")


def run_adaptive_ttl():
    """Apply adaptive TTL based on memory pressure"""
    if not cache_modules_available:
        console.print("[bold red]Error: Adaptive TTL not available[/bold red]")
        return
    
    console.print("[bold blue]Applying Adaptive TTL[/bold blue]")
    
    # Show current memory pressure
    pressure_level = get_memory_pressure_level()
    trend_direction, trend_rate = get_memory_trend()
    
    console.print(f"Current memory pressure level: [bold]{pressure_level}[/bold]")
    console.print(f"Memory trend: [bold]{trend_direction}[/bold] at {trend_rate:.2f}%/hr")
    
    # Apply adaptive TTL
    start_time = time.time()
    updated_count = apply_adaptive_ttl()
    duration = time.time() - start_time
    
    if updated_count > 0:
        console.print(f"[green]Updated TTL for {updated_count} keys in {duration:.2f} seconds[/green]")
    else:
        console.print(f"[yellow]No TTL adjustments needed (memory pressure level: {pressure_level})[/yellow]")


async def main_async():
    parser = argparse.ArgumentParser(description="Redis Monitoring and Optimization Tool")
    
    # Define commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    subparsers.add_parser("stats", help="Show Redis statistics")
    subparsers.add_parser("retention", help="Run Redis retention policies")
    subparsers.add_parser("optimize", help="Run full Redis optimization")
    subparsers.add_parser("keys", help="Show keys without expiry")
    subparsers.add_parser("patterns", help="Show memory usage by pattern")
    subparsers.add_parser("memory", help="Show detailed memory statistics")
    subparsers.add_parser("cache", help="Show cache performance metrics")
    subparsers.add_parser("preload", help="Run cache preloading")
    subparsers.add_parser("adaptive-ttl", help="Apply adaptive TTL based on memory pressure")
    
    invalidate_parser = subparsers.add_parser("invalidate", help="Invalidate cache namespace")
    invalidate_parser.add_argument("namespace", help="Cache namespace to invalidate")
    
    reset_parser = subparsers.add_parser("reset-metrics", help="Reset cache metrics")
    
    args = parser.parse_args()
    
    # Execute the appropriate function based on the command
    if args.command == "stats":
        show_redis_stats()
    elif args.command == "retention":
        run_retention()
    elif args.command == "optimize":
        optimize()
    elif args.command == "keys":
        show_keys_without_expiry()
    elif args.command == "patterns":
        show_patterns()
    elif args.command == "memory":
        show_memory_stats()
    elif args.command == "cache":
        show_cache_metrics()
    elif args.command == "preload":
        await run_preload()
    elif args.command == "invalidate" and args.namespace:
        run_invalidate(args.namespace)
    elif args.command == "reset-metrics":
        reset_cache_metrics()
        console.print("[green]Cache metrics have been reset[/green]")
    elif args.command == "adaptive-ttl":
        run_adaptive_ttl()
    else:
        parser.print_help()


def main():
    """Entry point for the CLI"""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()