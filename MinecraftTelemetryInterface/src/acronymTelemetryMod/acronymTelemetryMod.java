package acronymTelemetryMod;

import net.minecraft.init.Blocks;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.Mod.EventHandler;
import net.minecraftforge.fml.common.SidedProxy;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPostInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;

@Mod(modid = acronymTelemetryMod.MODID, version = acronymTelemetryMod.VERSION, acceptableRemoteVersions = "*")
public class acronymTelemetryMod
{
    public static final String MODID = "acronymTelemetryMod";
    public static final String VERSION = "1.0";
    
    @Mod.Instance(acronymTelemetryMod.MODID)
    public static acronymTelemetryMod instance;
    
    @SidedProxy(clientSide="acronymTelemetryMod.ClientOnlyProxy", serverSide="acronymTelemetryMod.DedicatedServerProxy")
    public static CommonProxy proxy;
    
    
    @EventHandler
    public void preInit(FMLPreInitializationEvent event)
    {
      proxy.preInit();
    }
    
    @EventHandler
    public void init(FMLInitializationEvent event)
    {
        // some example code

        System.out.println("DIRT BLOCK >> "+Blocks.DIRT.getUnlocalizedName());
    }
    
    @EventHandler
    public void postInit(FMLPostInitializationEvent event)
    {
      proxy.postInit();
    }
    
    
    /*
    * Prepend the name with the mod ID, suitable for ResourceLocations such as textures.
    * @param name
    * @return eg "minecraftbyexample:myblockname"
    */
   public static String prependModID(String name) {return MODID + ":" + name;}
}