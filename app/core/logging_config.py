import logging
import sys


def setup_logging(debug: bool = False) -> None:
    level = logging.DEBUG if debug else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )

    # Reduz verbosidade de libs externas
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if debug else logging.WARNING
    )
    logging.getLogger("uvicorn").setLevel(logging.INFO)


logger = logging.getLogger("bombeiros")
