using UnityEngine;
using System.Collections;

namespace SpicyPixel
{
    public class ConcurrencyKitRotateObject : MonoBehaviour
    {
        // Use this for initialization
        void Start ()
        {
		
        }
		
        // Update is called once per frame
        void Update ()
        {
            transform.Rotate (Vector3.up, -200f * Time.deltaTime);
        }
    }
}