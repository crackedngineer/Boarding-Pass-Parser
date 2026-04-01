"""
Environment-specific configurations.
Provides different settings based on the deployment environment.
"""

from typing import Dict, Any
from core.settings import Settings


class EnvironmentConfig:
    """Base environment configuration class."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
    
    @property
    def is_development(self) -> bool:
        return self.settings.environment.lower() == "development"
    
    @property
    def is_production(self) -> bool:
        return self.settings.environment.lower() == "production"
    
    @property  
    def is_testing(self) -> bool:
        return self.settings.environment.lower() == "testing"


class DevelopmentConfig(EnvironmentConfig):
    """Development environment specific settings."""
    
    def __init__(self, settings: Settings):
        super().__init__(settings)
        
    @property
    def cors_config(self) -> Dict[str, Any]:
        return {
            "allow_origins": ["*"],
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"],
        }
    
    @property
    def logging_config(self) -> Dict[str, Any]:
        return {
            "level": "DEBUG",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "handlers": ["console"]
        }


class ProductionConfig(EnvironmentConfig):
    """Production environment specific settings."""
    
    def __init__(self, settings: Settings):
        super().__init__(settings)
        
    @property
    def cors_config(self) -> Dict[str, Any]:
        return {
            "allow_origins": self.settings.allowed_origins,
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": [
                "Accept",
                "Accept-Language", 
                "Content-Language",
                "Content-Type",
                "Authorization"
            ],
        }
    
    @property
    def logging_config(self) -> Dict[str, Any]:
        return {
            "level": "INFO",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "handlers": ["file", "console"]
        }


class TestingConfig(EnvironmentConfig):
    """Testing environment specific settings."""
    
    def __init__(self, settings: Settings):
        super().__init__(settings)
        
    @property
    def cors_config(self) -> Dict[str, Any]:
        return {
            "allow_origins": ["http://localhost:3000"],
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"],
        }
    
    @property
    def logging_config(self) -> Dict[str, Any]:
        return {
            "level": "WARNING",
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "handlers": ["console"]
        }


def get_environment_config(settings: Settings) -> EnvironmentConfig:
    """
    Factory function to get the appropriate environment configuration.
    
    Args:
        settings: Application settings
        
    Returns:
        Environment-specific configuration instance
    """
    environment = settings.environment.lower()
    
    config_map = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig,
    }
    
    config_class = config_map.get(environment, DevelopmentConfig)
    return config_class(settings)