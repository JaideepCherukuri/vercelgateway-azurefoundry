#!/usr/bin/env python3
"""
Azure AI Foundry - Working Models Test Suite
=============================================
Tests all working models on Azure AI Foundry deployment "jai-omi":
- GPT-5.2-chat (Chat Completions)
- Kimi-K2.5 (Chat Completions)
- GPT-5.3-codex (Responses API)
- Sora-2 (Video Generation)

NOT WORKING (Azure API limitation):
- FLUX.2-pro (Image generation - 500 error)
"""

import os
import sys
import time
import base64
import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Azure AI Foundry Configuration
AZURE_ENDPOINT = "https://jai-omi.openai.azure.com/openai/v1/"
AZURE_API_KEY = os.getenv("AZURE_API_KEY")

if not AZURE_API_KEY:
    print("❌ Error: AZURE_API_KEY not set in .env")
    sys.exit(1)

# Initialize OpenAI client
client = OpenAI(
    base_url=AZURE_ENDPOINT,
    api_key=AZURE_API_KEY,
)


def test_gpt52_chat():
    """Test GPT-5.2 Chat via Chat Completions API"""
    print("\n🧪 Test 1: GPT-5.2 Chat")
    print("-" * 50)
    
    try:
        response = client.chat.completions.create(
            model="gpt-5.2-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Explain quantum computing in one sentence."}
            ],
            max_tokens=100
        )
        
        print(f"✅ GPT-5.2 Response: {response.choices[0].message.content}")
        print(f"📊 Tokens: {response.usage.total_tokens}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_kimi_k25():
    """Test Kimi K2.5 via Chat Completions API"""
    print("\n🧪 Test 2: Kimi K2.5")
    print("-" * 50)
    
    try:
        response = client.chat.completions.create(
            model="Kimi-K2.5",
            messages=[
                {"role": "user", "content": "Write a haiku about artificial intelligence."}
            ],
            max_tokens=50
        )
        
        print(f"✅ Kimi K2.5 Response: {response.choices[0].message.content}")
        print(f"📊 Tokens: {response.usage.total_tokens}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_gpt53_codex():
    """Test GPT-5.3 Codex via Responses API"""
    print("\n🧪 Test 3: GPT-5.3 Codex")
    print("-" * 50)
    
    try:
        response = client.responses.create(
            model="gpt-5.3-codex",
            input="Write a Python function to calculate fibonacci numbers"
        )
        
        print(f"✅ GPT-5.3 Codex Response:")
        print(response.output_text[:500] + "..." if len(response.output_text) > 500 else response.output_text)
        print(f"📊 Tokens: {response.usage.total_tokens}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_sora2_video():
    """Test Sora-2 Video Generation"""
    print("\n🧪 Test 4: Sora-2 Video Generation")
    print("-" * 50)
    
    try:
        print("Creating video generation job...")
        video = client.videos.create(
            model="sora-2",
            prompt="A cute baby polar bear walking in the snow",
            size="720x1280",
            seconds="4",
        )
        
        print(f"✅ Video generation started!")
        print(f"ID: {video.id}")
        print(f"Status: {video.status}")
        
        # Poll for completion
        print("\n⏳ Polling for completion...")
        while video.status not in ["completed", "failed", "cancelled"]:
            print(f"Status: {video.status}. Waiting 10 seconds...")
            time.sleep(10)
            video = client.videos.retrieve(video.id)
        
        if video.status == "completed":
            print(f"\n✅ Video generation completed!")
            print(f"Progress: {video.progress}%")
            
            # Download the video
            print("\n⬇️ Downloading video...")
            content = client.videos.download_content(video.id, variant="video")
            content.write_to_file("sora_output.mp4")
            print(f"✅ Video saved to sora_output.mp4")
            return True
        else:
            print(f"❌ Video generation failed: {video.status}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    print("=" * 60)
    print("Azure AI Foundry - Working Models Test Suite")
    print("=" * 60)
    print(f"Endpoint: {AZURE_ENDPOINT}")
    
    results = {
        "GPT-5.2-chat": test_gpt52_chat(),
        "Kimi-K2.5": test_kimi_k25(),
        "GPT-5.3-codex": test_gpt53_codex(),
        "Sora-2": test_sora2_video(),
    }
    
    print("\n" + "=" * 60)
    print("📋 Test Summary")
    print("=" * 60)
    for model, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{model}: {status}")
    
    all_passed = all(results.values())
    print("\n" + ("🎉 All tests passed!" if all_passed else "⚠️ Some tests failed"))
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
