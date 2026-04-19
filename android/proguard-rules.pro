# Firebase proguard rules
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Serialization
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Room
-keep class androidx.room.** { *; }

# Coil
-keep class coil.** { *; }
