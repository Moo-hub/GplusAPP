"""
Scheduled tasks for Redis monitoring and optimization
This module sets up background tasks to run Redis monitoring and optimization on a schedule
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from contextlib import asynccontextmanager

from app.core.redis_monitor import (
    log_redis_stats,
    run_retention_policy_enforcement,
    run_full_optimization
)
from app.core.redis_monitoring import run_monitoring_check
from app.core.redis_client import get_redis_client

# Configure logging
logger = logging.getLogger("redis_tasks")
logger.setLevel(logging.INFO)

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None

# Default schedule intervals
DEFAULT_SCHEDULE_CONFIG = {
    "stats_interval_minutes": 30,            # Log Redis stats every 30 minutes
    "retention_interval_hours": 3,           # Run retention policies every 3 hours
    "optimization_cron": "0 3 * * *",        # Run full optimization at 3 AM daily
    "memory_warning_threshold_percent": 75,  # Log warning when Redis memory exceeds 75%
    "memory_critical_threshold_percent": 90, # Log critical when Redis memory exceeds 90%
    "monitoring_interval_minutes": 15,       # Run monitoring alerts every 15 minutes
    "alert_enabled": True                    # Enable monitoring alerts
}


async def check_redis_memory_usage():
    """
    Check Redis memory usage and log warnings if above thresholds
    """
    from app.core.redis_monitor import get_redis_stats
    
    try:
        stats = get_redis_stats()
        if not stats:
            return
        
        # Calculate memory utilization (as percentage)
        memory_used = stats.used_memory
        memory_peak = stats.used_memory_peak
        
        # If we don't know the max memory, use the peak as reference
        memory_percent = (memory_used / memory_peak * 100) if memory_peak > 0 else 0
        
        # Log based on thresholds
        if memory_percent >= DEFAULT_SCHEDULE_CONFIG["memory_critical_threshold_percent"]:
            logger.critical(f"CRITICAL: Redis memory usage at {memory_percent:.1f}% ({memory_used} bytes)")
        elif memory_percent >= DEFAULT_SCHEDULE_CONFIG["memory_warning_threshold_percent"]:
            logger.warning(f"WARNING: Redis memory usage at {memory_percent:.1f}% ({memory_used} bytes)")
        else:
            logger.debug(f"Redis memory usage at {memory_percent:.1f}% ({memory_used} bytes)")
    
    except Exception as e:
        logger.error(f"Error checking Redis memory usage: {e}")


async def task_log_redis_stats():
    """
    Task to periodically log Redis statistics
    """
    logger.info("Running scheduled task: Redis stats logging")
    try:
        log_redis_stats()
        await check_redis_memory_usage()
    except Exception as e:
        logger.error(f"Error in Redis stats logging task: {e}")


async def task_run_retention_policies():
    """
    Task to enforce Redis retention policies
    """
    logger.info("Running scheduled task: Redis retention policy enforcement")
    try:
        run_retention_policy_enforcement()
    except Exception as e:
        logger.error(f"Error in Redis retention policy task: {e}")


async def task_run_optimization():
    """
    Task to run full Redis optimization
    """
    logger.info("Running scheduled task: Redis full optimization")
    try:
        run_full_optimization()
    except Exception as e:
        logger.error(f"Error in Redis optimization task: {e}")


async def task_run_monitoring_alerts():
    """
    Task to periodically run Redis monitoring checks and send alerts
    """
    logger.info("Running scheduled task: Redis monitoring alerts")
    try:
        # Get Redis client
        redis_client = get_redis_client()
        if not redis_client:
            logger.error("Failed to get Redis client for monitoring alerts")
            return
            
        # Run monitoring check
        result = await run_monitoring_check(redis_client)
        
        # Log alerts sent
        if result.get("alert_count", 0) > 0:
            logger.info(f"Redis monitoring sent {result['alert_count']} alerts: {', '.join(result['alerts_sent'])}")
        else:
            logger.debug("Redis monitoring completed with no alerts")
            
    except Exception as e:
        logger.error(f"Error in Redis monitoring alerts task: {e}")


def configure_scheduler(app: FastAPI, config: Dict[str, Any] = None):
    """
    Configure and start the task scheduler
    """
    global scheduler
    
    if scheduler:
        logger.warning("Scheduler already configured, skipping")
        return
    
    # Use provided config or default
    schedule_config = config or DEFAULT_SCHEDULE_CONFIG
    
    # Create scheduler
    scheduler = AsyncIOScheduler()
    
    # Add Redis monitoring tasks
    scheduler.add_job(
        task_log_redis_stats,
        IntervalTrigger(minutes=schedule_config["stats_interval_minutes"]),
        id="redis_stats_logging",
        replace_existing=True,
    )
    
    scheduler.add_job(
        task_run_retention_policies,
        IntervalTrigger(hours=schedule_config["retention_interval_hours"]),
        id="redis_retention_policies",
        replace_existing=True,
    )
    
    scheduler.add_job(
        task_run_optimization,
        CronTrigger.from_crontab(schedule_config["optimization_cron"]),
        id="redis_optimization",
        replace_existing=True,
    )
    
    # Add Redis monitoring alerts task if enabled
    if schedule_config.get("alert_enabled", True):
        scheduler.add_job(
            task_run_monitoring_alerts,
            IntervalTrigger(minutes=schedule_config.get("monitoring_interval_minutes", 15)),
            id="redis_monitoring_alerts",
            replace_existing=True,
        )
        logger.info(f"Redis monitoring alerts scheduled every {schedule_config.get('monitoring_interval_minutes', 15)} minutes")
    
    # Start the scheduler
    scheduler.start()
    logger.info(
        "Redis monitoring scheduler configured: "
        f"Stats every {schedule_config['stats_interval_minutes']} minutes, "
        f"Retention every {schedule_config['retention_interval_hours']} hours, "
        f"Optimization at cron '{schedule_config['optimization_cron']}'"
    )
    
    # Register shutdown handler
    @app.on_event("shutdown")
    def shutdown_scheduler():
        if scheduler and scheduler.running:
            logger.info("Shutting down Redis monitoring scheduler")
            scheduler.shutdown()


async def run_initial_redis_check():
    """
    Run initial Redis checks at application startup
    """
    logger.info("Running initial Redis check")
    try:
        # Log current stats
        log_redis_stats()
        
        # Check memory usage
        await check_redis_memory_usage()
        
        # Run initial monitoring check if alerts are enabled
        if DEFAULT_SCHEDULE_CONFIG.get("alert_enabled", True):
            try:
                redis_client = get_redis_client()
                if redis_client:
                    logger.info("Running initial Redis monitoring check")
                    result = await run_monitoring_check(redis_client)
                    if result.get("alert_count", 0) > 0:
                        logger.warning(f"Initial Redis check found {result['alert_count']} alert conditions")
            except Exception as e:
                logger.error(f"Error during initial Redis monitoring check: {e}")
        
        # Schedule full optimization for off-peak hours if not already run today
        now = datetime.now()
        if now.hour < 3:  # Before 3 AM
            # Schedule for today at 3 AM
            next_run = now.replace(hour=3, minute=0, second=0, microsecond=0)
        else:
            # Schedule for tomorrow at 3 AM
            next_run = (now + timedelta(days=1)).replace(hour=3, minute=0, second=0, microsecond=0)
        
        delay = (next_run - now).total_seconds()
        logger.info(f"Scheduled initial full Redis optimization for {next_run.isoformat()}")
        
    except Exception as e:
        logger.error(f"Error during initial Redis check: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager
    This runs at startup and shutdown, with the yield separating the two phases
    """
    # Startup
    logger.info("Application starting up")
    await run_initial_redis_check()
    
    yield
    
    # Shutdown
    logger.info("Application shutting down")
    if scheduler and scheduler.running:
        scheduler.shutdown()