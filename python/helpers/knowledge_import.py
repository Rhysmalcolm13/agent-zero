
import glob
import os
import hashlib
import json
from typing import Any, Dict, Literal, TypedDict
from langchain.document_loaders import (
    CSVLoader, JSONLoader, PyPDFLoader, TextLoader, UnstructuredHTMLLoader,
    UnstructuredMarkdownLoader, DirectoryLoader, PythonLoader
)
from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser

text_loader_kwargs = {'autodetect_encoding': True}

class KnowledgeImport(TypedDict):
    file: str
    checksum: str
    ids: list[str]
    state: Literal["changed", "original", "removed"]
    documents: list[Any]

def calculate_checksum(file_path: str) -> str:
    hasher = hashlib.md5()
    with open(file_path, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def load_knowledge(knowledge_dir: str, index: Dict[str, KnowledgeImport]) -> Dict[str, KnowledgeImport]:
    knowledge_dir = os.path.abspath(knowledge_dir)
    
    # Mapping file extensions to corresponding loader classes
    file_types_loaders = {
        'txt': TextLoader,
        'pdf': PyPDFLoader,
        'csv': CSVLoader,
        'html': UnstructuredHTMLLoader,
        'json': JSONLoader,
        'md': UnstructuredMarkdownLoader,
        'py': PythonLoader,
        'js': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".js"],
            parser=LanguageParser(language="js")
        ),
        'java': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".java"],
            parser=LanguageParser(language="java")
        ),
        'c': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".c"],
            parser=LanguageParser(language="c")
        ),
        'cpp': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".cpp"],
            parser=LanguageParser(language="cpp")
        ),
        'rb': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".rb"],
            parser=LanguageParser(language="ruby")
        ),
        'go': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".go"],
            parser=LanguageParser(language="go")
        ),
        'php': lambda path: GenericLoader.from_filesystem(
            knowledge_dir,
            glob="**/*",
            suffixes=[".php"],
            parser=LanguageParser(language="php")
        )
    }

    cnt_files = 0
    cnt_docs = 0

    # Fetch all files in the directory with specified extensions
    kn_files = glob.glob(os.path.join(knowledge_dir, '**/*'), recursive=True)
    if kn_files:
        print(f"Found {len(kn_files)} knowledge files in {knowledge_dir}, processing...")

    for file_path in kn_files:
        ext = file_path.split('.')[-1].lower()
        if ext in file_types_loaders:
            checksum = calculate_checksum(file_path)
            file_key = os.path.relpath(file_path, knowledge_dir)
            
            # Load existing data from the index or create a new entry
            file_data = index.get(file_key, {})
            
            if file_data.get('checksum') == checksum:
                file_data['state'] = 'original'
            else:
                file_data['state'] = 'changed'
            
            if file_data['state'] == 'changed':
                file_data['checksum'] = checksum
                loader_cls = file_types_loaders[ext]
                loader = loader_cls(file_path)
                
                if hasattr(loader, 'load'):
                    file_data['documents'] = loader.load()
                elif isinstance(loader, GenericLoader):
                    file_data['documents'] = loader.load()
                else:
                    raise ValueError(f'Loader for {ext} does not support loading documents.')
                cnt_files += 1
                cnt_docs += len(file_data['documents'])
                print(f'Loaded {len(file_data["documents"])} documents from {file_path}')
            # Update the index
            index[file_key] = file_data # type: ignore

    # loop index where state is not set and mark it as removed
    for file_key, file_data in index.items():
        if not file_data.get('state', ''):
            index[file_key]['state'] = 'removed'

    print(f"Processed {cnt_docs} documents from {cnt_files} files.")
    return index

if __name__ == '__main__':
    knowledge_dir = 'knowledge'  # Specify the knowledge directory
    index = {}  # Initialize the index
    load_knowledge(knowledge_dir, index)

