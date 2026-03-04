from setuptools import setup

setup(
    name="clawreform",
    version="0.2.1",
    description="Official Python client for the clawREFORM by aegntic.ai REST API",
    py_modules=["clawreform_sdk", "clawreform_client"],
    python_requires=">=3.8",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
