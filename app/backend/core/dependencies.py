"""
Dependency injection container using dependency-injector.
Provides centralized dependency management following SOLID principles.
"""

from dependency_injector import containers, providers
from dependency_injector.wiring import Provide, inject

from db.supabase import get_supabase_client
from services.parser_service import BoardingPassService
from services.auth_service import AuthService
from parsers.factory import ParserFactory
from core.settings import get_settings


class Container(containers.DeclarativeContainer):
    """Main dependency injection container."""
    
    # Configuration
    config = providers.Configuration()
    
    # Settings
    settings = providers.Singleton(get_settings)
    
    # Database
    supabase_client = providers.Singleton(get_supabase_client)
    
    # Core services
    parser_factory = providers.Singleton(ParserFactory)
    
    # Business services
    boarding_pass_service = providers.Factory(
        BoardingPassService,
        factory=parser_factory
    )
    
    auth_service = providers.Factory(
        AuthService,
        supabase_client=supabase_client
    )


# Dependency injection helpers
def get_container() -> Container:
    """Get the dependency injection container."""
    return Container()


# Common dependency providers for route handlers
def get_boarding_pass_service(
    service: BoardingPassService = Provide[Container.boarding_pass_service]
) -> BoardingPassService:
    return service


def get_auth_service(
    service: AuthService = Provide[Container.auth_service]
) -> AuthService:
    return service