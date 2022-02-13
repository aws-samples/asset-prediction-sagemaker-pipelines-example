import time
import logging

_logger = logging.getLogger('run_fe_step')
_logger.addHandler(logging.StreamHandler())
_logger.setLevel(logging.INFO)

db_logs = []
    
def _log(msg, level):
    db_logs.append({ 'at': round(time.time() * 1000), 'msg': msg, 'level': level })
    _logger.info(msg)

def info(msg):
    _log(msg, level='info')

def debug(msg):
    _logger.debug(msg)

def warning(msg):
    _log(msg, level='warning')
    _logger.warning(msg)

def error(msg):
    _log(msg, level='error')
    _logger.error(msg)
        
def clear():
    db_logs.clear()
        
def get_logs():
    return db_logs