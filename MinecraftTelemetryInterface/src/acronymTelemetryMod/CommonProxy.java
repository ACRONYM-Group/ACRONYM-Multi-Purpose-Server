package acronymTelemetryMod;

import java.util.Timer;
import java.util.TimerTask;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;

import acronymTelemetryMod.CommonProxy.SayHello;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.dedicated.*;
import net.minecraft.world.World;
import net.minecraftforge.fml.common.FMLCommonHandler;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.Mod.EventHandler;
import net.minecraftforge.fml.common.SidedProxy;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPostInitializationEvent;
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.TickEvent;

/**
 * CommonProxy is used to set up the mod and start it running.  It contains all the code that should run on both the
 *   Standalone client and the dedicated server.
 *   For more background information see here http://greyminecraftcoder.blogspot.com/2013/11/how-forge-starts-up-your-code.html
 */
public abstract class CommonProxy {
  /**
   * Run before anything else. Read your config, create blocks, items, etc, and register them with the GameRegistry
   */
	
	public int tickCount = 0;
	@SubscribeEvent
	 public void onServerTick(TickEvent.ServerTickEvent event) {
		tickCount += 1;
		System.out.println("TICK!");
		if (tickCount >= 100) {
			System.out.println("A.C.R.O.N.Y.M. Telemetry Loop");
			MinecraftServer server = FMLCommonHandler.instance().getMinecraftServerInstance();
			//World.getPlayers(null, null)
	    	//new GreetClient().startConnection(server.getCurrentPlayerCount());
	    	tickCount = 0;
		}
	}
	
	public class GreetClient {
	    private Socket clientSocket;
	    private PrintWriter out;
	    private BufferedReader in;
	    
	    public void run() {
	    	
	    }
	    public void startConnection() {
	    	try {
	        clientSocket = new Socket("192.168.1.11", 12345);
	        out = new PrintWriter(clientSocket.getOutputStream(), true);
	        in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
	        MinecraftServer server = FMLCommonHandler.instance().getMinecraftServerInstance();
	        out.println(server.getBuildLimit() );
	        String resp = in.readLine();
	        System.out.println(resp);
		    } catch(IOException e) {
				throw new RuntimeException(e);
			}
	    }
	 
	    public void sendMessage(String msg) {
	    	try {
	        //out.println("Minecraft Data String");
	        //String resp = in.readLine();
	        //return resp;
	    	//} catch(IOException e) {
				//throw new RuntimeException(e);
			} finally {}
	    }
	 
	    public void stopConnection() {
	    	try {
	        in.close();
	        out.close();
	        clientSocket.close();
	    	} catch(IOException e) {
				throw new RuntimeException(e);
			}
	    }
	}
	
	class SayHello extends TimerTask {
	    public void run() {
	    	System.out.println("A.C.R.O.N.Y.M. Telemetry Loop");
	    	new GreetClient().startConnection();
	    	new GreetClient().sendMessage("Minecraft Data");
	    	//new GreetClient().stopConnection();
			
	    }
	}

  public void preInit()
  {
	   //read config first

	  
  }

  /**
   * Do your mod setup. Build whatever data structures you care about. Register recipes,
   * send FMLInterModComms messages to other mods.
   */
  public void init()
  {
	  
	  
  }

  /**
   * Handle interaction with other mods, complete your setup based on this.
   */
  public void postInit()
  {
	  Timer timer = new Timer();
	  timer.schedule(new SayHello(), 0, 5000);
  }

  // helper to determine whether the given player is in creative mode
  //  not necessary for most examples
  abstract public boolean playerIsInCreativeMode(EntityPlayer player);

  /**
   * is this a dedicated server?
   * @return true if this is a dedicated server, false otherwise
   */
  abstract public boolean isDedicatedServer();
}
